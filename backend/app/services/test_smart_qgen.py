# test_smart_qgen.py

import requests
import re
import json

def test_generate_questions(text_chunk, max_questions=15, model="llama3"):
    prompt = f"""
Generate up to {max_questions} question-answer pairs from the following text.
Respond ONLY in this exact JSON format:
[
  {{ "question": "...", "answer": "..." }},
  ...
]

No explanations, no markdown, no other text.

Text:
{text_chunk}
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt.strip(), "stream": False}
        )
        response.raise_for_status()
        output_text = response.json()["response"].strip()

        print("\n=== FULL RAW MODEL OUTPUT ===\n")
        print(output_text)
        print("\n=== END OF RAW OUTPUT ===\n")

        # Try to extract JSON array from output
        match = re.search(r"\[\s*{.*?}\s*]", output_text, re.DOTALL)
        if not match:
            print("❌ No valid JSON array found in model output.")
            return

        json_str = match.group()
        qa_pairs = json.loads(json_str)
        print(f"✅ Parsed {len(qa_pairs)} question-answer pairs:")
        for i, qa in enumerate(qa_pairs, 1):
            print(f"Q{i}: {qa.get('question')}")
        print()

    except Exception as e:
        print("❌ Generation failed:", e)

if __name__ == "__main__":
    sample_text = """
Motion: The Essence of Change and Progress
Motion is one of the most fundamental aspects of our universe. From the swirling galaxies millions of light-years away to the minute vibrations of atoms, motion governs the behavior of matter and energy at every scale. The study of motion has not only advanced scientific knowledge but has also shaped our understanding of existence, progress, and the very nature of life itself.
The Physics of Motion
At its core, motion is the change in the position of an object with respect to time and a reference point. The study of motion, known as kinematics, is a branch of classical mechanics in physics. Isaac Newton’s groundbreaking work in the 17th century laid the foundation for our understanding of motion with his three laws:
1.	Newton’s First Law (Law of Inertia): An object remains at rest or in uniform motion in a straight line unless acted upon by an external force.
2.	Newton’s Second Law: The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass (F = ma).
3.	Newton’s Third Law: For every action, there is an equal and opposite reaction.
These laws describe how objects move and interact with forces. They have enabled humankind to achieve feats once thought impossible: launching satellites into space, engineering skyscrapers that sway safely in the wind, and even predicting the orbits of planets and comets with incredible accuracy.
In the 20th century, Albert Einstein revolutionized our understanding of motion with his theories of relativity. According to special relativity, as objects approach the speed of light, time dilates and mass increases, altering the simple Newtonian view of motion. General relativity further extended these ideas, describing how massive objects curve spacetime, causing what we perceive as gravitational motion.
Motion in the Natural World
Motion is omnipresent in nature. The Earth rotates on its axis and revolves around the Sun, which itself moves around the center of the Milky Way galaxy. On a much smaller scale, water flows in rivers, air circulates in the atmosphere, and animals migrate across continents. Even seemingly stationary objects are in constant motion at the atomic and molecular level.
Biological systems are full of intricate motion. The beating of the human heart, the firing of neurons, and the contraction of muscles all depend on precise, coordinated movement. At the microscopic level, motor proteins like kinesin and dynein transport vital substances along cellular highways, ensuring that life’s processes continue seamlessly.
The study of animal and plant motion has also inspired numerous innovations in robotics and engineering. Biomimicry—design inspired by nature’s movements—has led to the development of robotic arms, flying drones modeled after birds and insects, and even prosthetic limbs that mimic natural gait and motion patterns.
"""
    test_generate_questions(sample_text, max_questions=15, model="llama3")