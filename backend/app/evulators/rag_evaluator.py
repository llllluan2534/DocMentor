from deepeval.metrics import (
    FaithfulnessMetric,
    ContextualRelevancyMetric,
    AnswerRelevancyMetric
)
from deepeval.test_case import LLMTestCase
from deepeval import evaluate
from typing import List, Dict, Any

class RAGEvaluator:

    def __init__(self):
        # DeepEval sẽ dùng GEMINI key bạn đã có
        self.metrics = [
            FaithfulnessMetric(model="gemini-pro"),
            ContextualRelevancyMetric(model="gemini-pro"),
            AnswerRelevancyMetric(model="gemini-pro"),
        ]

    async def evaluate(
        self,
        query: str,
        answer: str,
        contexts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:

        context_texts = [
            c.get("text", "") for c in contexts if isinstance(c, dict)
        ]

        test_case = LLMTestCase(
            input=query,
            actual_output=answer,
            retrieved_contexts=context_texts
        )

        result = evaluate(
            test_cases=[test_case],
            metrics=self.metrics,
            run_async=True
        )

        # Convert result to dictionary
        out = {
            "faithfulness": result[0].metrics_data["Faithfulness"].score,
            "context_relevance": result[0].metrics_data["Contextual Relevancy"].score,
            "answer_relevance": result[0].metrics_data["Answer Relevancy"].score,
        }

        return out
