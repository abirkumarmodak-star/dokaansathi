import { useNavigate } from "react-router-dom";
import "./LanguageSelection.css";

function LanguageSelection() {

    const navigate = useNavigate();

    const selectLanguage = (language) => {

        localStorage.setItem(
            "language",
            language
        );

        navigate("/health");

    };

    return (

        <div className="language-container">

            <h1>🌍 Select Your Language</h1>

            <p>আপনার ভাষা নির্বাচন করুন</p>

            <div className="language-buttons">

                <button
                    onClick={() => selectLanguage("bn")}
                >
                    🇮🇳 বাংলা
                </button>

                <button
                    onClick={() => selectLanguage("hi")}
                >
                    🇮🇳 हिन्दी
                </button>

                <button
                    onClick={() => selectLanguage("en")}
                >
                    🇬🇧 English
                </button>

            </div>

        </div>

    );

}

export default LanguageSelection;