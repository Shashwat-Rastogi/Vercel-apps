import csv
import random
import json
import math

# --- 1. ENGLISH GENERATORS (Target: 200) ---
vocab_bank = [
    {"word": "Abundant", "syn": "Plentiful", "ant": "Scarce"},
    {"word": "Candid", "syn": "Frank", "ant": "Deceptive"},
    {"word": "Diligent", "syn": "Industrious", "ant": "Lazy"},
    {"word": "Lucid", "syn": "Clear", "ant": "Ambiguous"},
    {"word": "Obsolete", "syn": "Outdated", "ant": "Current"},
    {"word": "Pragmatic", "syn": "Practical", "ant": "Idealistic"},
    {"word": "Tenacious", "syn": "Persistent", "ant": "Yielding"},
    {"word": "Vindicate", "syn": "Justify", "ant": "Condemn"},
    {"word": "Zealous", "syn": "Enthusiastic", "ant": "Apathetic"},
    {"word": "Mitigate", "syn": "Alleviate", "ant": "Aggravate"}
]

def gen_eng_vocab():
    word = random.choice(vocab_bank)
    is_syn = random.choice([True, False])
    if is_syn:
        distractors = [w["syn"] for w in random.sample(vocab_bank, 4) if w["word"] != word["word"]][:3]
        return {"module": "english", "topic": "Synonyms", "text": f"Choose the synonym for: {word['word'].upper()}", "answer": word["syn"], "distractors": json.dumps(distractors)}
    else:
        distractors = [w["ant"] for w in random.sample(vocab_bank, 4) if w["word"] != word["word"]][:3]
        return {"module": "english", "topic": "Antonyms", "text": f"Choose the antonym for: {word['word'].upper()}", "answer": word["ant"], "distractors": json.dumps(distractors)}

def gen_eng_grammar():
    templates = [
        {"text": "Find the error: (A) Neither of the two men / (B) were very strong / (C) so they failed. / (D) No error.", "ans": "(B) were very strong", "dist": ["(A)", "(C)", "(D) No error"]},
        {"text": "Improve the sentence: He is senior than me in college.", "ans": "senior to me", "dist": ["senior from me", "more senior than me", "No improvement"]},
        {"text": "Find the error: (A) I have visited / (B) Niagara Falls / (C) last weekend. / (D) No error.", "ans": "(A) I have visited", "dist": ["(B)", "(C)", "(D) No error"]}
    ]
    q = random.choice(templates)
    return {"module": "english", "topic": "Grammar", "text": q["text"], "answer": q["ans"], "distractors": json.dumps(q["dist"])}

# --- 2. LOGICAL GENERATORS (Target: 180) ---
def gen_log_series():
    start = random.randint(2, 10)
    pattern = random.choice(["add", "square"])
    if pattern == "add":
        gap = random.randint(3, 8)
        seq = [start + i*gap for i in range(4)]
        ans = start + 4*gap
        dist = [str(ans+gap), str(ans-1), str(ans+2)]
    else:
        seq = [start**2, (start+1)**2, (start+2)**2, (start+3)**2]
        ans = (start+4)**2
        dist = [str(ans+10), str(ans-5), str((start+5)**2)]
    
    random.shuffle(dist)
    return {"module": "logic", "topic": "Number Series", "text": f"Find the next number: {seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, ?", "answer": str(ans), "distractors": json.dumps(dist)}

def gen_log_sequence():
    sequences = [
        {"items": ["1. Seed", "2. Fruit", "3. Plant", "4. Tree"], "ans": "1, 3, 4, 2", "dist": ["1, 4, 3, 2", "2, 3, 4, 1", "3, 1, 4, 2"]},
        {"items": ["1. Probation", "2. Interview", "3. Selection", "4. Appointment"], "ans": "2, 3, 4, 1", "dist": ["2, 4, 3, 1", "3, 2, 4, 1", "2, 3, 1, 4"]}
    ]
    q = random.choice(sequences)
    return {"module": "logic", "topic": "Logical Word Sequence", "text": f"Arrange in logical order:\n" + " \n".join(q["items"]), "answer": q["ans"], "distractors": json.dumps(q["dist"])}

def gen_log_direction():
    triplets = [(3, 4, 5), (6, 8, 10), (5, 12, 13)]
    t = random.choice(triplets)
    return {"module": "logic", "topic": "Directional Sense", "text": f"A man walks {t[0]} km East, turns left and walks {t[1]} km. How far is he from the start?", "answer": f"{t[2]} km", "distractors": json.dumps([f"{t[2]+2} km", f"{t[0]+t[1]} km", f"{t[2]-1} km"])}

# --- 3. QUANT GENERATORS (Target: 120) ---
def gen_quant_hcf_lcm():
    a, b = random.sample(range(12, 40, 2), 2)
    hcf = math.gcd(a, b)
    lcm = (a * b) // hcf
    is_lcm = random.choice([True, False])
    if is_lcm:
        ans = str(lcm)
        distractors = [str(lcm + 12), str(lcm - hcf), str(a * b)]
        text = f"Find the LCM of {a} and {b}."
    else:
        ans = str(hcf)
        distractors = [str(hcf + 2), str(hcf * 2), str(1)]
        text = f"Find the HCF of {a} and {b}."
    return {"module": "quant", "topic": "HCF & LCM", "text": text, "answer": ans, "distractors": json.dumps(distractors)}

def gen_quant_interest():
    p = random.randint(10, 50) * 100
    r = random.randint(5, 15)
    t = random.randint(2, 5)
    si = int((p * r * t) / 100)
    dist = [f"Rs. {si+100}", f"Rs. {si-50}", f"Rs. {int(si*1.1)}"]
    return {"module": "quant", "topic": "Simple & Compound Interest", "text": f"Find the Simple Interest on Rs. {p} at {r}% per annum for {t} years.", "answer": f"Rs. {si}", "distractors": json.dumps(dist)}

def gen_quant_probability():
    total = random.choice([10, 20, 30])
    favorable = random.randint(3, total - 5)
    gcd_val = math.gcd(favorable, total)
    ans = f"{favorable//gcd_val}/{total//gcd_val}"
    dist = [f"1/{(total//gcd_val)+1}", f"{(favorable//gcd_val)+1}/{total//gcd_val}", "1/2"]
    return {"module": "quant", "topic": "Probability", "text": f"A bag contains {total} balls, out of which {favorable} are red. What is the probability of drawing a red ball?", "answer": ans, "distractors": json.dumps(dist)}

def gen_quant_combinatorics():
    n = random.randint(5, 9)
    r = random.randint(2, 4)
    ans = math.comb(n, r)
    dist = [str(ans + n), str(ans - 2), str(math.perm(n, r))]
    return {"module": "quant", "topic": "Permutation & Combinations", "text": f"In how many ways can a team of {r} members be selected from a group of {n} people?", "answer": str(ans), "distractors": json.dumps(dist)}


# --- COMPILER ---
def main():
    filename = "amcat_master_syllabus.csv"
    
    eng_funcs = [gen_eng_vocab, gen_eng_grammar]
    log_funcs = [gen_log_series, gen_log_sequence, gen_log_direction]
    quant_funcs = [gen_quant_hcf_lcm, gen_quant_interest, gen_quant_probability, gen_quant_combinatorics]
    
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=["module", "topic", "text", "answer", "distractors"])
        writer.writeheader()
        
        # Exact distribution for 10 complete tests
        for _ in range(200): writer.writerow(random.choice(eng_funcs)())
        for _ in range(180): writer.writerow(random.choice(log_funcs)())
        for _ in range(120): writer.writerow(random.choice(quant_funcs)())
            
    print(f"Success! 500 questions mapped exactly to your syllabus generated to {filename}")

if __name__ == "__main__":
    main()