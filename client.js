import { Client, Collection } from 'discord.js';
import axios from 'axios';
import { Ollama } from 'ollama';


export default class Streamyfin extends Client {
  constructor(...options) {
    super(...options);

    this.commands = new Collection();
    this.userId = '398161771476549654';
    this.repoOrg = process.env.REPO_ORG;
    this.repoName = process.env.REPO_NAME;
    this.githubToken = process.env.GITHUB_TOKEN;
    this.ollamaAPI = new Ollama({ host: process.env.OLLAMA_URL })
  }
  convertUnits(text) {
    const unitConversionRegex = /(-?\d+(?:\.\d+)?)\s?(°?[FC]|celsius|fahrenheit|km|kilometers?|mi\b|miles?|kg|kilograms?|lbs?|pounds?|g|grams?|m\b|meters?|ft|feet|in|inches?)\b/gi;
    let unitConversionMatch;
    let result = []
    while ((unitConversionMatch = unitConversionRegex.exec(text)) !== null) {
      const unit = unitConversionMatch[2].toLowerCase();
      const value = parseFloat(unitConversionMatch[1]);
      let forumla;
      switch (unit) {
        case 'c':
        case '°c':
        case 'celsius':
          forumla = `- ${value}°C ≈ ${((value * 9 / 5) + 32).toFixed(2)}°F`;
          break;
        case 'f':
        case '°f':
        case 'fahrenheit':
          forumla = `- ${value}°F ≈ ${((value - 32) * 5 / 9).toFixed(2)}°C`;
          break;
        case 'km':
        case 'kilometer':
        case 'kilometers':
          forumla = `- ${value} km ≈ ${(value * 0.621371).toFixed(2)} miles`;
          break;
        case 'mi':
        case 'mile':
        case 'miles':
          forumla = `- ${value} miles ≈ ${(value * 1.609344).toFixed(3)} km`;
          break;
        case 'kg':
        case 'kilogram':
        case 'kilograms':
          forumla = `- ${value} kg ≈ ${(value * 2.20462).toFixed(2)} lbs`;
          break;
        case 'lb':
        case 'lbs':
        case 'pound':
        case 'pounds':
          forumla = `- ${value} lbs ≈ ${(value * 0.453592).toFixed(2)} kg`;
          break;
        case 'g':
        case 'gram':
        case "grams":
          forumla = `- ${value} g ≈ ${(value * 0.00220462).toFixed(4)} lbs`;
          break;
        case 'm':
        case 'meter':
        case 'meters':
          forumla = `- ${value} m ≈ ${(value * 3.28084).toFixed(2)} ft`;
          break;
        case 'ft':
        case 'feet':
        case "feets":
          forumla = `- ${value} ft ≈ ${(value * 0.3048).toFixed(2)} m`;
          break;
        case 'in':
        case 'inch':
        case 'inches':
          forumla = `- ${value} in ≈ ${(value * 2.54).toFixed(2)} cm`;
          break;
      }
      if (forumla) result.push(forumla);
    }
    return result?.length > 0 ? "Unit conversion:\n" + result.join("\n") : null;
  }
  async ollamaTranslate(text) {
    const isEmoji = /^(\s*(?:<a?:[a-zA-Z0-9_]+:\d+>|[:a-zA-Z0-9_]+:|[\u2700-\u27BF]|\uE000-\uF8FF|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])\s*)+$/;
    const isMentions = /@\w+/g;
    const isChannel = /#\w+/g;
    const isLink = /https?:\/\/[^\s]+/g;
    if (isEmoji.test(text.trim()) || isLink.test(text) || isMentions.test(text) || isChannel.test(text)) return;
    console.log(text)
    try {
      const prompt = `
You are a translation assistant.
Translate all input text into English.
Respond only with the following format, using new lines:

Language: (Original Language) -> English
Confidence: [XX]% ([Prediction|Accurate])
Translation:
${text}

Follow the following rules:
- Do not include any extra commentary, explanations, or conversational filler. 
- Always display the confidence as a percentage. 
- If the translation is highly confident (e.g., common phrases, well-known words, or if you are certain of the context), use "Accurate". 
- Otherwise, use "Prediction". If the original language cannot be confidently identified, state "Unknown" for "Original Language" and "0% (Prediction)" for "Confidence".
- Analyse your confidence score and the translation itself.
- If you are not confident in the translation, try to provide a best-effort translation, but lower the confidence score accordingly and indicate it as a "Prediction".
- Follow the format and rules above strictly.
`;

      let translated = await this.ollamaAPI.generate({
        model: "aya-expanse",
        //model: "zongwei/gemma3-translator:4b",
        prompt,
        stream: false,
        keep_alive: "2h"
      });
      console.log(translated)
      if (translated.done) {
        return { translated: true, text: translated.response };
      } else {
        return { "translated": false };

      }
    } catch (err) {
      console.log(err)
    }
  }
  async fetchStats() {
    const url = `https://api.github.com/repos/streamyfin/streamyfin/contributors?anon=1`;

    const response = await axios.get(url);
    const contributors = await response.data;

    return contributors.map((contributor) => ({
      username: contributor.login || contributor.name,
      contributions: contributor.contributions,
    }));
  };

  async fetchReleases() {
    try {
      const response = await axios.get(
        `${process.env.GITHUB_API_BASE}/repos/${this.repoOrg}/${this.repoName}/releases`,
        {
          headers: {
            Authorization: `token ${this.githubToken}`,
          },
        }
      );

      const releases = response.data
        .slice(0, 2) // Fetch the latest 2 releases
        .map((release) => ({ name: release.name, value: release.name }));

      releases.push({ name: "Older", value: "Older" }); // Add "Older" as an option

      return releases;
    } catch (error) {
      console.error("Error fetching releases:", error);
      return [
        { name: "unknown", value: "unknown" }, // Fallback data
      ];
    }
  };

  async repoCheck(repoName) {
    repoName = repoName.replace(/\s+/g, '-');
    try {
      const response = await axios.get(`https://api.github.com/repos/${this.repoOrg}/${repoName}`);
      if (response.data && response.data?.id) {
        return { exists: true, data: response.data };
      } else {
        return { exists: false };
      }
    } catch (error) {
      console.error('Error checking repository:', error.message);
      return { exists: false, error: error.message };
    }
  }

  async checkMessage(message) {
    try {
      const response = await axios.post(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_APIKEY}`,
        {
          comment: { text: message },
          requestedAttributes: { TOXICITY: {}, FLIRTATION: {} },
        }
      );

      if (response.data && response.data.attributeScores) {
        const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;
        const flirtationScore = response.data.attributeScores.FLIRTATION.summaryScore.value;

        return toxicityScore >= 0.2 || flirtationScore >= 0.2;
      } else {
        throw new Error('Invalid response from Perspective API');
      }
    } catch (error) {
      console.error('Error analyzing message:', error);
      return false;
    }
  }


};