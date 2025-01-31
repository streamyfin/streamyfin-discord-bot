const { Client, Collection, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = class Streamyfin extends Client {
  constructor(...options) {
    super(...options);

    this.commands = new Collection();
    this.userId = '398161771476549654';
    this.repoOrg = process.env.REPO_ORG;
    this.repoName = process.env.REPO_NAME;
    this.githubToken = process.env.GITHUB_TOKEN;

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