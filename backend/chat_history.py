from typing import List, Tuple

class ChatHistory:
    def __init__(self):
        self.messages = []   # stores {"role": ..., "content": ...}

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})

    def get_history(self) -> List[dict]:
        return self.messages

    def get_langchain_history(self) -> List[Tuple[str, str]]:
        """Returns history in (human, ai) tuple format for LangChain chains."""
        history = []
        for i in range(0, len(self.messages) - 1, 2):
            human = self.messages[i]["content"]
            ai = self.messages[i + 1]["content"] if i + 1 < len(self.messages) else ""
            history.append((human, ai))
        return history

    def clear(self):
        self.messages = []

    def __len__(self):
        return len(self.messages)
