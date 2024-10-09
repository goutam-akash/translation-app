import React, { useState } from "react";
import "./App.css";
import { Configuration, OpenAIApi } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BeatLoader } from "react-spinners";

const App = () => {
  const [formData, setFormData] = useState({
    toLanguage: "Spanish",
    message: "",
    model: "gemini-1.5-flash-002",
  });
  const [error, setError] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previousTranslations, setPreviousTranslations] = useState([]);

  const googleGenAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
  const configuration = new Configuration({
    apiKey: import.meta.env.VITE_OPENAI_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const supportedLanguages = {
    "gpt-3.5-turbo": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese"],
    "gpt-4": ["Spanish", "French", "Telugu", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
    "gpt-4-turbo": ["Spanish", "French", "Telugu", "Japanese", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Korean", "Arabic"],
    "gemini-1.5-pro-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
    "gemini-1.5-flash-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
    "gemini-1.5-pro-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
    "gemini-1.5-flash-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Arabic"],
    "deepl": ["Spanish", "French", "Japanese", "German", "Italian", "Dutch", "Russian", "Chinese (Simplified)", "Polish", "Portuguese"],
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const translateWithDeepL = async (text, toLang) => {
    const response = await fetch(`https://api.deepl.com/v2/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        auth_key: import.meta.env.VITE_DEEPL_API_KEY, // Ensure this variable is defined
        text: text,
        source_lang: "EN", // Set the source language to English
        target_lang: toLang.substring(0, 2).toUpperCase(),
      }),
    });
    const data = await response.json();
    return data.translations[0].text;
  };

  const translate = async () => {
    const { toLanguage, message, model } = formData;
    try {
      setIsLoading(true);
      let translatedText = "";

      if (model.startsWith("gpt")) {
        const response = await openai.createChatCompletion({
          model: model,
          messages: [
            { role: "system", content: `Translate this sentence into ${toLanguage}.` },
            { role: "user", content: message },
          ],
          temperature: 0.3,
          max_tokens: 100,
        });
        translatedText = response.data.choices[0].message.content.trim();
      } else if (model.startsWith("gemini")) {
        const genAIModel = googleGenAI.getGenerativeModel({ model });
        const prompt = `Translate the text: "${message}" from English to ${toLanguage}`;
        const result = await genAIModel.generateContent(prompt);
        translatedText = await result.response.text();
      } else if (model === "deepl") {
        translatedText = await translateWithDeepL(message, toLanguage);
      }

      setTranslation(translatedText);

      // Update previous translations with details
      setPreviousTranslations((prev) => {
        const newTranslation = {
          from: "English", // Fixed source language
          to: toLanguage,
          model: model,
          originalText: message,
          translatedText: translatedText,
        };
        const newTranslations = [newTranslation, ...prev];
        return newTranslations.slice(0, 5); // Keep only the last 5 translations
      });
    } catch (error) {
      console.error("Translation error:", error);
      setError("Translation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    if (!formData.message) {
      setError("Please enter the message.");
      return;
    }
    translate();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translation);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  return (
    <div className="container">
      <div className="sidebar">
        <h2>Models</h2>
        <div className="choices">
  {["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gemini-1.5-pro-001", "gemini-1.5-flash-001", "gemini-1.5-pro-002", "gemini-1.5-flash-002", "deepl"].map((model) => (
    <button
      key={model}
      className={`model-option ${formData.model === model ? 'active' : ''}`}
      onClick={() => handleInputChange({ target: { name: "model", value: model } })} // Update model selection
    >
      {model}
    </button>
  ))}
</div>

      </div>


      <div className="main">
        <h1>Translation App</h1>
        <div>
          <h3>Seleted Model: {formData.model}</h3>
        </div>
        <form onSubmit={handleOnSubmit}>
          {/* To Language Selection */}
          <div className="choiceslang">
            <label htmlFor="toLanguage">To:</label>
            <select
              id="toLanguage"
              name="toLanguage"
              value={formData.toLanguage}
              onChange={handleInputChange}
            >
              {supportedLanguages[formData.model]?.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Message Input */}
          <textarea
            name="message"
            placeholder="Type your message here..."
            value={formData.message}
            onChange={handleInputChange}
          ></textarea>

          {error && <div className="error">{error}</div>}

          <button type="submit">Translate</button>
        </form>

        <div className="translation">
          <div className="copy-btn" onClick={handleCopy} title="Copy to clipboard">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 4.5H15a.75.75 0 01.75.75v0c0 .212-.03.418-.084.612m-7.332 0c-.646-.049-1.288-.11-1.927-.184-1.1-.128-1.907-1.077-1.907-2.185V4.5a2.25 2.25 0 012.25-2.25h9a2.25 2.25 0 012.25 2.25v0c0 1.108-.806 2.057-1.907 2.185a48.208 48.208 0 01-1.927.184M7.5 4.5v15m7.5-15v15m3.375-11.25c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
              />
            </svg>
          </div>
          {isLoading ? <BeatLoader size={12} color={"red"} /> : translation}
        </div>

        <div className={`notification ${showNotification ? "active" : ""}`}>
          Copied to clipboard!
        </div>

        {/* Previous Translations Section */}
        <div className="previous-translations">
          <h3>Previous Translations:</h3>
          <ul>
            {previousTranslations.map((prevTranslation, index) => (
              <li key={index}>
                <strong>To:</strong> {prevTranslation.to}
                <strong>&emsp;Model:</strong> {prevTranslation.model}
                <strong>&emsp;Original:</strong> {prevTranslation.originalText}
                <strong>&emsp;Translated:</strong> {prevTranslation.translatedText}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
