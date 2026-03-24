from typing import List, Dict

class ChatHistory:
    def __init__(self):
        self.history: List[Dict] = []

    def add_message(self, role: str, content: str):
        self.history.append({"role": role, "content": content})

    def get_history(self):
        return self.history
