# 🛒 Kasparro Hackathon (Track 5): AI Product Checker

Shopping on the internet is changing. Very soon, people will use AI bots to buy things for them. If a product description is confusing or missing details, the AI bot won't buy it! So, we built a tool that helps sellers fix their product listings so AI bots can understand them perfectly.

---

## 🚫 What We Are NOT
We read the hackathon rules very carefully. 
- **Not a chat bot:** You do not chat with our tool. 
- **Not a useless wrapper:** We don't just send text to an AI and print the answer.
- **Not a flashy toy:** This is a real tool that does real work safely.

---

## ✅ What We Built
Instead of a chat bot, we built a strict **AI Grader**. 

It takes a product, gives it to the AI, and forces the AI to output a clean, organized report card (called JSON). It grades the product on how clear and consistent it is, and gives it a final status: Red, Yellow, or Green.

---

## 💻 How to Run the Code

### Step 1: Install what you need
You need to install the Google AI code library. Run this in your terminal:
```bash
pip install google-generativeai
```

### Step 2: Add your key
You need to tell the computer your secret Google API key:
```bash
export GEMINI_API_KEY="your_api_key_here"
```

### Step 3: Run the program
Run the main file:
```bash
python3 main.py
```

### Step 4: See the results
The program will slowly check 5 products (waiting in between so it doesn't break the free tier rules). When it finishes, it will save a neat file called `results.json` that holds all the report cards!

---

**Want to know how the code works?** Check out the **[ARCHITECTURE.md](./ARCHITECTURE.md)** file!
