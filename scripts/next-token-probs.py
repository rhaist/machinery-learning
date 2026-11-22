#!/usr/bin/env python3
"""Collect real next-token probabilities from a small open model, for the guide's demos.

Several demos (the start-page demo, the sampler, "One word at a time" in chapter 1) show
next-word probabilities that were written by hand. This script measures what a real model
predicts for the same prompts, so the demos can show real numbers with the model's name.

Run it once, by hand, on a machine that can reach Hugging Face. It is not part of the build
and not part of CI.

    python3 -m venv .venv && . .venv/bin/activate
    pip install torch transformers
    python scripts/next-token-probs.py > research/next-token-probs.json

What it does:
  - downloads an open model (default: HuggingFaceTB/SmolLM2-360M, Apache-2.0, about 0.7 GB).
    Weights are loaded from safetensors only and no code from the model repository is run.
  - for each prompt below, records how the model's own tokenizer splits it, the model's most
    likely next tokens, and the probability of a few named candidates
  - for the chapter 1 sentence, records a small tree of continuations and what the model
    writes after each possible first word
  - prints one JSON document to stdout. It writes no files and sends nothing anywhere.

Try another model with --model, for example --model openai-community/gpt2 (2019, much weaker).
"""
import argparse
import datetime
import json
import sys

# Prompts and hand-picked candidates. The first three mirror src/scripts/hero-prompts.js.
PROMPTS = [
    {"id": "firewall", "prompt": "The firewall blocked the",
     "candidates": ["connection", "request", "traffic", "attack", "port", "IP", "user", "banana"]},
    {"id": "python", "prompt": "for i in range(",
     "candidates": ["len", "n", "10", "0", "1", "self", "x", "banana"], "no_space": True},
    {"id": "deutsch", "prompt": "Die Hauptstadt von Deutschland ist",
     "candidates": ["Berlin", "die", "eine", "seit", "Bonn", "nicht", "München", "Banane"]},
    {"id": "australia", "prompt": "The capital of Australia is",
     "candidates": ["Canberra", "Sydney", "Melbourne"], "tree": True},
]


def load(model_id, revision):
    """Model and tokenizer. Safetensors only, no remote code."""
    from transformers import AutoModelForCausalLM, AutoTokenizer
    tok = AutoTokenizer.from_pretrained(model_id, revision=revision, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(
        model_id, revision=revision, trust_remote_code=False, use_safetensors=True)
    model.eval()
    return tok, model


def next_probs(tok, model, ids):
    """Probability of every vocabulary entry as the next token after `ids`."""
    import torch
    with torch.no_grad():
        logits = model(torch.tensor([ids])).logits[0, -1]
    return torch.softmax(logits.double(), dim=-1), logits.double()


def encode(tok, text):
    """Token ids for a prompt, with the model's start-of-text token if it uses one."""
    ids = tok(text, add_special_tokens=False)["input_ids"]
    if tok.bos_token_id is not None:
        ids = [tok.bos_token_id] + ids
    return ids


def top(tok, probs, logits, k):
    import torch
    p, i = torch.topk(probs, k)
    return [{"token": tok.decode([int(t)]), "id": int(t), "p": round(float(q), 6), "logit": round(float(logits[int(t)]), 4)}
            for q, t in zip(p, i)]


def candidate(tok, probs, word, no_space):
    """Probability that the next token starts `word`. Multi-token words report their first token only."""
    text = word if no_space else " " + word
    ids = tok(text, add_special_tokens=False)["input_ids"]
    return {"word": word, "tokens": [tok.decode([t]) for t in ids], "first_token_p": round(float(probs[ids[0]]), 6),
            "whole_word_is_one_token": len(ids) == 1}


def tree(tok, model, ids, depth, width):
    """The `width` most likely next tokens, and below each of them the same again, `depth` levels deep."""
    if depth == 0:
        return []
    probs, logits = next_probs(tok, model, ids)
    out = []
    for node in top(tok, probs, logits, width):
        del node["logit"]
        node["next"] = tree(tok, model, ids + [node["id"]], depth - 1, width)
        out.append(node)
    return out


def greedy(tok, model, ids, n):
    """Continue with the single most likely token, `n` times. Returns the new text only."""
    import torch
    new = []
    for _ in range(n):
        probs, _ = next_probs(tok, model, ids + new)
        t = int(torch.argmax(probs))
        if t == tok.eos_token_id:
            break
        new.append(t)
    return tok.decode(new)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--model", default="HuggingFaceTB/SmolLM2-360M")
    ap.add_argument("--revision", default=None, help="commit hash of the model repository, to pin the exact weights")
    ap.add_argument("--top", type=int, default=20, help="how many next tokens to record per prompt")
    args = ap.parse_args()

    import torch
    import transformers
    tok, model = load(args.model, args.revision)

    result = {
        "model": args.model,
        "revision": getattr(model.config, "_commit_hash", None) or args.revision,
        "parameters": sum(p.numel() for p in model.parameters()),
        "vocabulary": len(tok),
        "collected": datetime.date.today().isoformat(),
        "versions": {"torch": torch.__version__, "transformers": transformers.__version__},
        "prompts": [],
    }
    for spec in PROMPTS:
        print(f"… {spec['id']}", file=sys.stderr)
        ids = encode(tok, spec["prompt"])
        probs, logits = next_probs(tok, model, ids)
        shown = [t for t in ids if t != tok.bos_token_id]
        entry = {
            "id": spec["id"],
            "prompt": spec["prompt"],
            "prompt_tokens": [[tok.decode([t]), t] for t in shown],
            "top": top(tok, probs, logits, args.top),
            "candidates": [candidate(tok, probs, w, spec.get("no_space", False)) for w in spec["candidates"]],
        }
        if spec.get("tree"):
            entry["tree"] = tree(tok, model, ids, depth=3, width=3)
            # what the model writes once a first word has been chosen for it
            entry["forced"] = []
            for w in spec["candidates"]:
                forced = ids + tok(" " + w, add_special_tokens=False)["input_ids"]
                entry["forced"].append({"first_word": w, "continuation": greedy(tok, model, forced, 16)})
        result["prompts"].append(entry)

    json.dump(result, sys.stdout, ensure_ascii=False, indent=1)
    print()


if __name__ == "__main__":
    main()
