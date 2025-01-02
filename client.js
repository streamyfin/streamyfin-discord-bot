const { Client, Collection, EmbedBuilder } = require("discord.js");
const axios = require ("axios");

module.exports = class Streamyfin extends Client {
  constructor(...options) {
    super(...options);
    
    this.commands = new Collection();
    this.userId = '398161771476549654';

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

  async fetchReleases(){
    try {
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
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
        { name: "0.22.0", value: "0.22.0" }, // Fallback data
        { name: "0.21.0", value: "0.21.0" },
        { name: "Older", value: "Older" },
      ];
    }
  };
};