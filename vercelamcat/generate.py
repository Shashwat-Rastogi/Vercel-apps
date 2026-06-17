import csv
import random
import json

def generate_quant_profit_loss():
    cp = random.randint(20, 100) * 10
    profit_pct = random.choice([10, 15, 20, 25, 50])
    sp = int(cp * (1 + profit_pct / 100))
    distractors = [f"Rs. {sp - 20}", f"Rs. {sp + 20}", f"Rs. {sp + (cp // 10)}"]
    random.shuffle(distractors)
    
    return {
        "module": "quant",
        "topic": "Profit & Loss",
        "text": f"An article costs Rs. {cp}. It is sold at {profit_pct}% profit. What is the selling price?",
        "answer": f"Rs. {sp}",
        "distractors": json.dumps(distractors)
    }

def generate_quant_tsd():
    speed = random.randint(30, 90)
    time = random.randint(2, 8)
    dist = speed * time
    distractors = [f"{dist + 10} km", f"{dist - 20} km", f"{dist + speed} km"]
    random.shuffle(distractors)
    
    return {
        "module": "quant",
        "topic": "Time Speed Distance",
        "text": f"A train travels at {speed} km/h for {time} hours. What distance does it cover?",
        "answer": f"{dist} km",
        "distractors": json.dumps(distractors)
    }

def generate_logic_series():
    start = random.randint(2, 15)
    gap = random.randint(3, 9)
    seq = [start + (i * gap) for i in range(4)]
    ans = start + (4 * gap)
    distractors = [str(ans + gap), str(ans - 1), str(ans + 2)]
    random.shuffle(distractors)
    
    return {
        "module": "logic",
        "topic": "Number Series",
        "text": f"Find the next number in the series: {seq[0]}, {seq[1]}, {seq[2]}, {seq[3]}, ?",
        "answer": str(ans),
        "distractors": json.dumps(distractors)
    }

def generate_logic_direction():
    # Using Pythagorean triplets to ensure clean integer answers
    triplets = [(3, 4, 5), (6, 8, 10), (5, 12, 13), (9, 12, 15), (8, 15, 17)]
    t = random.choice(triplets)
    distractors = [f"{t[2] + 2} km", f"{t[2] - 1} km", f"{t[0] + t[1]} km"]
    random.shuffle(distractors)
    
    return {
        "module": "logic",
        "topic": "Direction Sense",
        "text": f"A person walks {t[0]} km North, turns right, and walks {t[1]} km. What is the shortest distance from the starting point?",
        "answer": f"{t[2]} km",
        "distractors": json.dumps(distractors)
    }

def main():
    total_questions = 1000
    filename = "amcat_bulk_questions.csv"
    
    # List of our generator functions
    generators = [
        generate_quant_profit_loss,
        generate_quant_tsd,
        generate_logic_series,
        generate_logic_direction
    ]
    
    # Open the CSV file for writing
    with open(filename, mode='w', newline='', encoding='utf-8') as file:
        fieldnames = ["module", "topic", "text", "answer", "distractors"]
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        
        # Write the header row
        writer.writeheader()
        
        # Generate the questions
        for _ in range(total_questions):
            gen_func = random.choice(generators)
            writer.writerow(gen_func())
            
    print(f"Success! {total_questions} questions have been written to {filename}")
    print("You can now upload this file directly to Supabase.")

if __name__ == "__main__":
    main()