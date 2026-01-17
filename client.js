import { Client, Collection } from 'discord.js';
import axios from 'axios';

const GITHUB_API = 'https://api.github.com';

export default class Streamyfin extends Client {
  constructor(...options) {
    super(...options);
    this.commands = new Collection();
    this.repoOrg = process.env.REPO_ORG || 'streamyfin';
    this.repoName = process.env.REPO_NAME || 'streamyfin';
    this.githubToken = process.env.GITHUB_TOKEN;
  }

  async fetchStats() {
    const url = `${GITHUB_API}/repos/${this.repoOrg}/${this.repoName}/contributors?anon=1`;
    const response = await axios.get(url);
    return response.data.map((contributor) => ({
      username: contributor.login || contributor.name,
      contributions: contributor.contributions,
    }));
  }

  async fetchReleases() {
    try {
      const headers = this.githubToken
        ? { Authorization: `token ${this.githubToken}` }
        : {};

      const response = await axios.get(
        `${GITHUB_API}/repos/${this.repoOrg}/${this.repoName}/releases`,
        { headers }
      );

      const releases = response.data
        .slice(0, 2)
        .map((release) => ({ name: release.name, value: release.name }));

      releases.push({ name: 'Older', value: 'Older' });
      return releases;
    } catch (error) {
      console.error('Error fetching releases:', error.message);
      return [{ name: 'unknown', value: 'unknown' }];
    }
  }

  async repoCheck(repoName) {
    const normalizedName = repoName.replace(/\s+/g, '-');
    try {
      const response = await axios.get(`${GITHUB_API}/repos/${this.repoOrg}/${normalizedName}`);
      return response.data?.id
        ? { exists: true, data: response.data }
        : { exists: false };
    } catch (error) {
      console.error('Error checking repository:', error.message);
      return { exists: false, error: error.message };
    }
  }
}
