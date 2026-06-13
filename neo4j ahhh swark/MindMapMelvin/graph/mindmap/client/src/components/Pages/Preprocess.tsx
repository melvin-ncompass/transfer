import React, { useState } from "react";
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Box,
  Dialog,
  DialogContent,
  CircularProgress,
  Card,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import ErrorBoundary from "../ErrorBoundary";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import StepPreprocess from "../Steps/StepPreprocess";
import StepBuildPrompt from "../Steps/StepBuildPrompt";
import StepAnalyzeFiles from "../Steps/StepAnalyzeFiles";
import StepContentFiltration from "../Steps/StepContentFiltration";
import StepSummary from "../Steps/StepSummary";
import StepGenerate from "../Steps/StepGenerate";

const steps = [
  "Metadata Collection",
  "Prompt Generation",
  "Context-Aware Batching",
  "Content Filtration",
  "Concise Summary Generation",
  "Generate Mindmap",
];

const Preprocess: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const [jsonResponse, setJsonResponse] = useState<any>(null);
  const [preprocessMessage, setPreprocessMessage] = useState<string | null>(
    null
  );

  const [directoryStructure, setDirectoryStructure] = useState<string | null>(
    null
  );
  const [filesList, setFilesList] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [openSidebar, setOpenSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promptData, setPromptData] = useState<any>(null);
  const [repoDiff, setRepoDiff] = useState<null | {
    extractedRepoStructure: string;
    filteredRepoStructure: string;
    totalExtractedFiles: number;
    totalFilteredFiles: number;
    removedFiles: string[];
  }>(null);

  const token = sessionStorage.getItem("access_token");
  const selectedRepo = sessionStorage.getItem("selected_repo") || "";
  const selectedBranch = sessionStorage.getItem("selected_branch") || "";
  const selectedCommit = sessionStorage.getItem("selected_commit") || "";
  const username = sessionStorage.getItem("username") || "";
  const repo = selectedRepo.includes("/")
    ? selectedRepo.split("/")[1]
    : selectedRepo;

  const handlePreprocess = async () => {
    if (!token || !selectedRepo || !selectedBranch || !selectedCommit) {
      setError("Repo, branch, or commit not selected");
      return;
    }

    setLoading(true);
    setError(null);
    setPreprocessMessage(null);

    try {
      const res = await fetch(
        `http://localhost:3000/repo/cloneCommit?token=${token}&repo=${selectedRepo}&branch=${selectedBranch}&commit=${selectedCommit}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Preprocess failed");
      setPreprocessMessage(data.message);


      const metaRes = await fetch(
        `http://localhost:3000/preprocess/metadata?repo=${selectedRepo}&username=${username}`
      );
      const metaData = await metaRes.json();
      if (!metaRes.ok)
        throw new Error(metaData.message || "Metadata fetch failed");

      const { directoryStructure, fileList } = metaData.data;

      setFilesList(fileList);
      setDirectoryStructure(directoryStructure);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildPrompt = async () => {
    if (!repo || !username) {
      setError("Repository or username not selected");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/preprocess/buildPrompt?repo=${repo}&username=${username}`
      );
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected response: ${text}`);
      }
      if (!res.ok) throw new Error(data.message || "Failed to build prompt");
      setPromptData(data.data.prompt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWithLLM = async () => {
    if (!repo || !username) {
      setError("Repository or username not found in session.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:3000/preprocess/analyzeWithLLM?repo=${repo}&username=${username}`
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      if (!data?.data) throw new Error("Invalid response: missing data");
      setJsonResponse(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContentFilteration = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterRes = await fetch(
        `http://localhost:3000/preprocess/contentFilteration?repo=${repo}&username=${username}`
      );
      const filterData = await filterRes.json();
      if (filterData?.data?.success) {
        const diffRes = await fetch(
          `http://localhost:3000/preprocess/repoDiff?repo=${repo}&username=${username}`
        );
        const diffData = await diffRes.json();
        if (diffData?.data) setRepoDiff(diffData.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndFetchSummary = async () => {
    if (!repo || !username) {
      setError("Repo or username not provided");
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const genRes = await fetch(
        `http://localhost:3000/preprocess/generateGraph?repo=${repo}&username=${username}`
      );
      const genData = await genRes.json();
      if (!genRes.ok)
        throw new Error(genData.message || "Failed to generate summary");

      const generateSummary = genData?.data?.generateSummary;
      console.log("Generated:", generateSummary);

      const fetchRes = await fetch(
        `http://localhost:3000/preprocess/getBatchSummary?repo=${repo}&username=${username}`
      );
      const fetchData = await fetchRes.json();
      if (!fetchRes.ok)
        throw new Error(fetchData.message || "Failed to fetch summary");

      setSummary(fetchData.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (error) {
      return (
        <Card sx={{ bgcolor: "#ffdddd", p: 2, mt: 2 }}>
          <Typography color="error" variant="h6">
            {error}
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => {
              setError(null);
              setActiveStep(0);
            }}
          >
            Reset
          </Button>
        </Card>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <StepPreprocess
            loading={loading}
            preprocessMessage={preprocessMessage}
            filesList={filesList as any}
            directoryStructure={directoryStructure}
            onPreprocess={handlePreprocess}
            onNext={() => setActiveStep(1)}
          />
        );

      case 1:
        return (
          <StepBuildPrompt
            loading={loading}
            promptData={promptData}
            onBuildPrompt={handleBuildPrompt}
            onNext={() => setActiveStep(2)}
          />
        );

      case 2:
        return (
          <StepAnalyzeFiles
            loading={loading}
            jsonResponse={jsonResponse}
            onAnalyze={handleAnalyzeWithLLM}
            onNext={() => setActiveStep(3)}
          />
        );

      case 3:
        return (
          <StepContentFiltration
            loading={loading}
            repoDiff={repoDiff}
            onFilter={handleContentFilteration}
            onNext={() => setActiveStep(4)}
          />
        );

      case 4:
        return (
          <StepSummary
            loading={loading}
            summary={summary}
            onGenerate={handleGenerateAndFetchSummary}
            onNext={() => setActiveStep(5)}
          />
        );

      case 5:
        return (
          <StepGenerate />
        )

      default:
        return (
          <Box onClick={() => navigate("/dashboard")}>
            <Typography color="#fff">Return to Home</Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar open={openSidebar} setOpen={setOpenSidebar} />

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            py: 2,
            px: 2,
            position: "sticky",
            top: 0,
            zIndex: 1100,
            width: "100%",
            bgcolor: "#0D1117",
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <IconButton
              onClick={() => setOpenSidebar(true)}
              sx={{ color: "#fff", mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                flexGrow: 1,
                "& .MuiStepLabel-label": {
                  fontSize: "1.1rem",
                  color: "#ffffff !important",
                },
                "& .MuiStepIcon-root": {
                  fontSize: "2.3rem",
                },
                "& .MuiStepIcon-root.Mui-active": {
                  color: "#4b4a49ff",
                  fontWeight: "bold",
                },
                "& .MuiStepIcon-root.Mui-completed": {
                  color: "#d3cfc9ff",
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

        </Box>


        <Box sx={{ textAlign: "center", px: 4 }}>
          <ErrorBoundary>{renderStepContent()}</ErrorBoundary>
        </Box>
      </Box>

      <Dialog open={loading}>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 4,
          }}
        >
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Processing… please wait</Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Preprocess;
