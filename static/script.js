document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("predictionForm");
    const button = document.getElementById("predictButton");

    const placeholder = document.getElementById("resultPlaceholder");
    const resultContent = document.getElementById("resultContent");
    const errorBox = document.getElementById("errorMessage");

    const gradeElement = document.getElementById("predictedGrade");
    const gradeLabel = document.getElementById("gradeLabel");
    const gradeMessage = document.getElementById("gradeMessage");
    const gradeMeter = document.getElementById("gradeMeter");
    const resultNote = document.getElementById("resultNote");

    if (!form || !button || !placeholder || !resultContent || !errorBox) {
        console.error("HTML IDs match nahi kar rahe. index.html check karo.");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        errorBox.hidden = true;
        resultContent.hidden = true;
        button.disabled = true;
        button.textContent = "Predicting...";

        try {
            const data = Object.fromEntries(new FormData(form).entries());

            const numericFields = [
                "age", "Medu", "Fedu", "traveltime", "studytime",
                "failures", "famrel", "freetime", "goout", "Dalc",
                "Walc", "health", "absences", "G1", "G2"
            ];

            numericFields.forEach(key => {
                data[key] = Number(data[key]);
            });

            const response = await fetch("/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const output = await response.json();

            if (!response.ok || output.status !== "success") {
                throw new Error(output.message || "Prediction failed.");
            }

            const grade = Number(output.predicted_grade);

            if (!Number.isFinite(grade)) {
                throw new Error("Invalid prediction received.");
            }

            gradeElement.textContent = grade.toFixed(2);
            gradeMeter.style.width = `${Math.min(100, Math.max(0, grade * 5))}%`;

            if (grade >= 16) {
                gradeLabel.textContent = "Excellent Performance";
                gradeMessage.textContent = "The predicted grade is high.";
            } else if (grade >= 12) {
                gradeLabel.textContent = "Good Performance";
                gradeMessage.textContent = "The predicted grade is good.";
            } else if (grade >= 10) {
                gradeLabel.textContent = "Moderate Performance";
                gradeMessage.textContent = "Consistent academic support may help.";
            } else {
                gradeLabel.textContent = "Needs Improvement";
                gradeMessage.textContent = "Additional academic support may be beneficial.";
            }

            resultNote.textContent =
                "Estimated grade out of 20. This is a prediction, not a guarantee.";

            placeholder.hidden = true;
            resultContent.hidden = false;

            document.getElementById("result").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {
            errorBox.textContent = error.message;
            errorBox.hidden = false;
            console.error("Prediction error:", error);
        } finally {
            button.disabled = false;
            button.textContent = "Predict Final Grade →";
        }
    });

    form.addEventListener("reset", () => {
        errorBox.hidden = true;
        resultContent.hidden = true;
        placeholder.hidden = false;
    });
});
