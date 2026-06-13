import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { pipeline } from 'node:stream/promises';
import * as tar from 'tar';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Project } from 'src/entities/project.entity';
import { Repository } from 'typeorm';

import * as unzipper from 'unzipper';
import * as fsExtra from 'fs-extra';

@Injectable()
export class RepoService {
  private readonly logger = new Logger(RepoService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private readonly configService: ConfigService,
  ) {}

  async getUserProfile(query: { token: string }) {
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${query.token}` },
    });

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch user profile: ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getRepos(query: { token: string }) {
    const allRepos: any[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&type=all`,
        {
          headers: { Authorization: `token ${query.token}` },
        },
      );

      if (!response.ok) {
        throw new BadRequestException(
          `Failed to fetch repositories: ${response.statusText}`,
        );
      }

      const repos = (await response.json()) as any[];

      if (repos.length === 0) {
        hasMorePages = false;
      } else {
        allRepos.push(...repos);
        page++;

        // If we got less than 100 repos, this is the last page
        if (repos.length < 100) {
          hasMorePages = false;
        }
      }
    }

    this.logger.log(`Fetched ${allRepos.length} repositories for user`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return allRepos;
  }

  async getBranches(query: { token: string; repo: string }) {
    const repos = (await this.getRepos(query)) as {
      name: string;
      owner: { login: string };
    }[];
    const targetRepo = repos.find(
      (r: { name: string }) => r.name === query.repo,
    );

    if (!targetRepo) {
      throw new Error(`Repository ${query.repo} not found`);
    }

    const owner = targetRepo.owner.login;

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${query.repo}/branches`,
      {
        headers: { Authorization: `token ${query.token}` },
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch branches: ${response.statusText}`,
      );
    }

    return response.json();
  }

  async getCommits(query: { token: string; repo: string; branch?: string }) {
    const repos: any = await this.getRepos(query);
    const targetRepo = repos.find((r) => r.name === query.repo);

    if (!targetRepo) {
      throw new BadRequestException(`Repository ${query.repo} not found`);
    }

    const owner = targetRepo.owner.login;
    const branch = query.branch || 'main';

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${query.repo}/commits?sha=${branch}`,
      {
        headers: { Authorization: `token ${query.token}` },
      },
    );

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch commits: ${response.statusText}`,
      );
    }

    return response.json();
  }

  async cloneRepoBranch(query: {
    token: string;
    repo: string;
    branch?: string;
  }) {
    const repos: any = await this.getRepos(query);
    const targetRepo = repos.find((r) => r.name === query.repo);

    if (!targetRepo) {
      throw new BadRequestException(`Repository ${query.repo} not found`);
    }

    const owner = targetRepo.owner.login;
    const branch = query.branch || 'main';
    const username = owner;
    const destDir = path.join('users', username, query.repo, branch);

    // Ensure destination directory exists
    fs.mkdirSync(destDir, { recursive: true });

    // Construct tarball URL
    const archiveUrl = `https://api.github.com/repos/${owner}/${query.repo}/tarball/${branch}`;

    // Fetch tarball
    const response: any = await fetch(archiveUrl, {
      headers: { Authorization: `token ${query.token}` },
    });

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to download repo: ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new BadRequestException('Invalid or missing response stream');
    }

    // Save tarball to disk
    const tarballPath = path.join(destDir, `${query.repo}-${branch}.tar.gz`);
    const fileStream = fs.createWriteStream(tarballPath);

    // // Convert Web ReadableStream to Node.js stream
    await pipeline(response.body, fileStream);

    return { message: `Repository ${query.repo} cloned to ${destDir}` };
  }

  // async cloneRepoCommit(query: {
  //   repo: string;
  //   commit: string;
  //   token: string;
  // }) {
  //   const USERS_ROOT : any = this.configService.get<string>('USERS_ROOT') || process.env.USERS_ROOT ; // Windows-style absolute path

  //   const repos: any = await this.getRepos(query);
  //   const targetRepo = repos.find((r) => r.name === query.repo);

  //   if (!targetRepo) {
  //     throw new BadRequestException(`Repository ${query.repo} not found`);
  //   }

  //   const owner = targetRepo.owner.login;
  //   const commitSha = query.commit;

  //   const userProfile:any = await this.getUserProfile(query);
  //   const userName = userProfile.login;

  //   if (!commitSha) {
  //     throw new BadRequestException('Missing commit SHA');
  //   }

  //   // Save to C:\discovery\mindmap\users\{username}\{repoName}
  //   const destDir = path.join(USERS_ROOT, userName, query.repo);
  //   fs.mkdirSync(destDir, { recursive: true });

  //   const archiveUrl = `https://api.github.com/repos/${owner}/${query.repo}/tarball/${commitSha}`;

  //   const response: any = await fetch(archiveUrl, {
  //     headers: { Authorization: `token ${query.token}` },
  //   });

  //   if (!response.ok) {
  //     throw new BadRequestException(
  //       `Failed to download repo: ${response.statusText}`,
  //     );
  //   }

  //   if (!response.body) {
  //     throw new BadRequestException('Invalid or missing response stream');
  //   }

  //   // Save tarball as {repoName}.tar.gz
  //   const zipPath = path.join(destDir, `${query.repo}.tar.gz`);
  //   const fileStream = fs.createWriteStream(zipPath);
  //   await pipeline(response.body, fileStream);

  //   // Extract tarball into destDir\extracted\
  //   const extractDir = path.join(destDir, 'extracted');
  //   fs.mkdirSync(extractDir, { recursive: true });

  //   await tar.x({
  //     file: zipPath,
  //     cwd: extractDir,
  //     gzip: true,
  //     strip: 1, // remove top-level folder from GitHub tarball
  //   });

  //   return {
  //     message: `Repository ${query.repo} at commit ${commitSha} saved and extracted to ${extractDir}`,
  //   };
  // }

  async cloneRepoCommit(query: {
    repo: string;
    commit: string;
    token: string;
  }) {
    const USERS_ROOT: any =
      this.configService.get<string>('USERS_ROOT') || process.env.USERS_ROOT;

    const repos: any = await this.getRepos(query);
    const targetRepo = repos.find((r) => r.name === query.repo);

    if (!targetRepo) {
      throw new BadRequestException(`Repository ${query.repo} not found`);
    }

    const owner = targetRepo.owner.login;
    const commitSha = query.commit;

    const userProfile: any = await this.getUserProfile(query);
    const userName = userProfile.login;

    if (!commitSha) {
      throw new BadRequestException('Missing commit SHA');
    }

    // Save to C:\discovery\mindmap\users\{username}\{repoName}
    const destDir = path.join(USERS_ROOT, userName, query.repo);
    fs.mkdirSync(destDir, { recursive: true });

    // Validate commit exists first
    const commitCheckUrl = `https://api.github.com/repos/${owner}/${query.repo}/commits/${commitSha}`;
    const commitCheckResponse: any = await fetch(commitCheckUrl, {
      headers: { Authorization: `token ${query.token}` },
    });

    if (!commitCheckResponse.ok) {
      if (commitCheckResponse.status === 422) {
        throw new BadRequestException(
          `Invalid commit SHA: ${commitSha}. The commit may not exist or the SHA format is incorrect.`,
        );
      }
      throw new BadRequestException(
        `Failed to validate commit: ${commitCheckResponse.statusText}`,
      );
    }

    const archiveUrl = `https://api.github.com/repos/${owner}/${query.repo}/tarball/${commitSha}`;
    const response: any = await fetch(archiveUrl, {
      headers: { Authorization: `token ${query.token}` },
    });

    if (!response.ok) {
      if (response.status === 422) {
        throw new BadRequestException(
          `Invalid repository or commit: ${commitSha}. Please verify the commit SHA is correct.`,
        );
      }
      throw new BadRequestException(
        `Failed to download repo: ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new BadRequestException('Invalid or missing response stream');
    }

    const zipPath = path.join(destDir, `${query.repo}.tar.gz`);
    const fileStream = fs.createWriteStream(zipPath);
    await pipeline(response.body, fileStream);

    const extractDir = path.join(destDir, 'extracted');
    fs.mkdirSync(extractDir, { recursive: true });

    await tar.x({
      file: zipPath,
      cwd: extractDir,
      gzip: true,
      strip: 1,
    });

    // Add or update User
    let user = await this.userRepository.findOne({
      where: { username: userName },
    });

    this.logger.log(`Looking for user: ${userName}`);

    if (user) {
      this.logger.log(`User found: ${user.id}, updating user info`);
      user.email = userProfile.email || user.email;
      user.role = user.role || 'user';
      user.updatedAt = new Date();
      await this.userRepository.save(user);
    } else {
      this.logger.log(`User not found, creating new user: ${userName}`);
      user = this.userRepository.create({
        username: userName,
        email: userProfile.email || null,
        role: 'user',
      });
      await this.userRepository.save(user);
      this.logger.log(`New user created with ID: ${user.id}`);
    }

    // Add or update Project
    this.logger.log(`Looking for project: ${query.repo} for user: ${user.id}`);
    let project = await this.projectRepository.findOne({
      where: { projectname: query.repo, user: { id: user.id } },
      relations: ['user'],
    });

    if (!project) {
      this.logger.log(`Project not found, creating new project: ${query.repo}`);
      project = this.projectRepository.create({
        projectname: query.repo,
        user,
      });
      await this.projectRepository.save(project);
      this.logger.log(`New project created with ID: ${project.id}`);
    } else {
      this.logger.log(`Project found: ${project.id}, updating project info`);
      // Update fields as needed
      project.updatedAt = new Date(); // assuming you have an updatedAt column
      await this.projectRepository.save(project);
    }

    return {
      message: `Repository ${query.repo} at commit ${commitSha} saved and extracted to ${extractDir}`,
      userId: user.id,
      projectId: project.id,
    };
  }

  async findGitDirRecursive(startDir: string) {
    const entries = fs.readdirSync(startDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(startDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === '.git') {
          return fullPath;
        }

        const found = await this.findGitDirRecursive(fullPath);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        if (found) return found;
      }
    }

    return null;
  }
  async cloneLocalRepo(
    query: { userName: string; repo: string; token: string },
    file: Express.Multer.File,
  ) {
    const userName = query.userName;

    const USERS_ROOT: any =
      this.configService.get<string>('USERS_ROOT') || process.env.USERS_ROOT;

    const baseDir = path.join(USERS_ROOT, query.userName, query.repo);
    console.log(baseDir)
    const zipPath = path.join(baseDir, 'uploaded.zip');
    console.log(zipPath)
    const extractedDir = path.join(baseDir, 'extracted');
    console.log(extractedDir)

    fs.mkdirSync(baseDir, { recursive: true });
    fs.mkdirSync(extractedDir, { recursive: true });

    // Save zip file to disk
    fs.writeFileSync(zipPath, file.buffer);

    // Extract directly to final location
    try {
      await fs
        .createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractedDir }))
        .promise();
    } catch (err) {
      throw new Error(`Failed to extract zip file: ${err.message}`);
    }

    // Recursively check for .git folder
    const gitDir = await this.findGitDirRecursive(extractedDir);
    if (!gitDir) {
      fsExtra.removeSync(extractedDir);
      fsExtra.removeSync(zipPath);
      throw new Error(
        'Upload rejected: .git directory not found anywhere in zip',
      );
    }

    const userProfile: any = await this.getUserProfile({ token: query.token });

    // Add or update User
    let user = await this.userRepository.findOne({
      where: { username: userName },
    });
    if (user) {
      user.email = userProfile.email || user.email;
      user.role = user.role || 'user';
      user.updatedAt = new Date();
      await this.userRepository.save(user);
    } else {
      user = this.userRepository.create({
        username: userName,
        email: userProfile.email || null,
        role: 'user',
      });
      await this.userRepository.save(user);
    }

    // Add or update Project
    let project = await this.projectRepository.findOne({
      where: { projectname: query.repo, user: { id: user.id } },
      relations: ['user'],
    });

    if (!project) {
      project = this.projectRepository.create({
        projectname: query.repo,
        user,
      });
    } else {
      // Update fields as needed
      project.updatedAt = new Date(); // assuming you have an updatedAt column
      // You can also update other fields here if necessary
    }

    await this.projectRepository.save(project);

    return {
      zipSavedTo: zipPath,
      extractedTo: extractedDir,
      gitFoundAt: gitDir,
      status: 'Valid repo with .git directory accepted',
      userId: user.id,
      projectId: project.id,
    };
  }
}
