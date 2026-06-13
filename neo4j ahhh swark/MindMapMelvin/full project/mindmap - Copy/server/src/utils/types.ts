type Metadata = {
  fileList: {
    relativePath: string;
    estimatedTokens: number;
    tokenSize: number;
  }[];
  totalFiles: number;
};

export type { Metadata };
