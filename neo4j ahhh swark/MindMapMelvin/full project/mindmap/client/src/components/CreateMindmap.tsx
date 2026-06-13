import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Divider,
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CustomButton from "./Atoms/CustomButton";
import CustomDropdown from "./Atoms/Dropdown";
import LoadingDialog from "./LoadingDialog";
import { useSessionStorage } from "../hooks";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

interface Repo {
  name: string;
  full_name: string;
}

interface Branch {
  name: string;
}

interface Commit {
  sha: string;
  commit: { message: string };
}

const CreateMindmap: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const [tabIndex, setTabIndex] = useState(0);

  const [repos, setRepos] = useState<Repo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [localRepo,setLocalRepo] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedCommit, setSelectedCommit] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file,setFile] = useState<File[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setInitialized(true);
  }, [query, navigate]);

  useEffect(() => {
    if (!initialized) return;
    const token = sessionStorage.getItem("access_token");
    if (!token) {
      setError("No token found. Please login again.");
      return;
    }

    setLoading(true);

    fetch(`http://localhost:3000/repo/allRepos?token=${token}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch repos");
        return res.json();
      })
      .then((response) => {
        setRepos(response.data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [initialized]);

  const fetchBranches = (repoName: string) => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    setSelectedRepo(repoName);
    setBranches([]);
    setCommits([]);
    setSelectedBranch("");

    setLoading(true);
    fetch(
      `http://localhost:3000/repo/repoBranches?token=${token}&repo=${repoName}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => res.json())
      .then((response) => {
        setBranches(response.data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const fetchCommits = (repoName: string, branch: string) => {
    const token = sessionStorage.getItem("access_token");
    if (!token) return;

    setSelectedBranch(branch);
    setLoading(true);

    fetch(
      `http://localhost:3000/repo/branchCommits?token=${token}&repo=${repoName}&branch=${branch}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => res.json())
      .then((response) => {
        if (response.data && Array.isArray(response.data)) {
          setCommits(response.data);
          setError(null);
        } else {
          setError(response.data || "Unexpected response");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  const handleFileUpload = async (e:any) => {

    console.log(localRepo)
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 300 * 1024 * 1024) {
    setUploadError(
      "File size exceeds 300MB. Please remove build files and try again."
    );
    return;
  }

  const username = sessionStorage.getItem("username") || "defaultUser";

  const formData = new FormData();
  formData.append("file", file);

  setLoading(true);
  try {
    const res = await fetch(
      `http://localhost:3000/repo/cloneLocalRepo?repo=${localRepo}userName=${username}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (res.ok && data.statusCode === 200) {
      setSuccessMessage(data.message);
      setError(null);
    } else {
      setUploadError(data.message || "Upload failed");
    }
  } catch (err: any) {
    setUploadError(err.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <Container sx={{ color: "#fff", mt: 4 }}>
      <LoadingDialog open={loading} message="Fetching data..." />

      <Box sx={{ mb: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          textColor="secondary"
          indicatorColor="secondary"
        >
          <Tab label="GitHub" />
          <Tab label="Local" />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <>
          {repos && (
            <Card sx={{ mb: 2, bgcolor: "#22272eff", height: "8.2rem" }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: "#ffffff" }}>
                  Select Repository
                </Typography>
                <Divider sx={{ mb: 2, borderColor: "#555" }} />
                <Box sx={{ width: "50rem" }}>
                  <CustomDropdown
                    value={selectedRepo}
                    onChange={fetchBranches}
                    options={repos.map((repo) => ({
                      label: repo.name,
                      value: repo.name,
                    }))}
                    fullWidth
                  />
                </Box>
              </CardContent>
            </Card>
          )}

          <Card sx={{ mb: 2, bgcolor: "#22272eff", height: "8.2rem" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>
                Select Branch
              </Typography>
              <Divider sx={{ mb: 2, borderColor: "#555" }} />
              <Box sx={{ width: "50rem" }}>
                <CustomDropdown
                  value={selectedBranch}
                  onChange={(val: any) => fetchCommits(selectedRepo, val)}
                  options={branches.map((b) => ({
                    label: b.name,
                    value: b.name,
                  }))}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2, bgcolor: "#22272eff", height: "8.2rem" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>
                Select Commit
              </Typography>
              <Divider sx={{ mb: 2, borderColor: "#555" }} />
              <Box sx={{ width: "50rem" }}>
                <CustomDropdown
                  value={selectedCommit}
                  onChange={setSelectedCommit}
                  options={commits.map((c) => ({
                    label: `${c.commit.message} (${c.sha.substring(0, 7)})`,
                    value: c.sha,
                  }))}
                  fullWidth
                />
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ textAlign: "right", mt: 3 }}>
            <CustomButton
              label="PROCEED"
              variant="contained"
              sx={{
                bgcolor: "#10B981",
                "&.Mui-disabled": {
                  bgcolor: "#343942",
                  color: "#fff",
                },
              }}
              disabled={!(selectedRepo && selectedBranch && selectedCommit)}
              onClick={() => {
                sessionStorage.setItem("selected_repo", selectedRepo || "");
                sessionStorage.setItem("selected_branch", selectedBranch || "");
                sessionStorage.setItem("selected_commit", selectedCommit || "");
                navigate("/preprocess");
              }}
            />
          </Box>
        </>
      )}

      {/* Local Tab */}
      {tabIndex === 1 && (
        <Card sx={{ mb: 2, bgcolor: "#22272eff", p: 3 }}>
          <Typography variant="h6" sx={{ color: "#ffffff", mb: 2 }}>
            Upload Local Repo (ZIP, max 30MB)
          </Typography>
          Enter repo name : 
          <input
          type="text"
          onChange={(e)=>setLocalRepo(e.target.value)}
          />
          <br />
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".zip"
          />
          <br />
          {/* <CustomButton
            label="Upload File"
            variant="contained"
            component="label"
            // onClick={handleFileUpload}
          >
          </CustomButton> */}
        </Card>
      )}

      {/* Error Dialog */}
      <Dialog open={!!uploadError} onClose={() => setUploadError(null)}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>{uploadError}</DialogContent>
        <DialogActions>
          <CustomButton label="OK" onClick={() => setUploadError(null)} />
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={!!successMessage} onClose={() => setSuccessMessage(null)}>
        <DialogTitle>Success</DialogTitle>
        <DialogContent>{successMessage}</DialogContent>
        <DialogActions>
          <CustomButton label="OK" onClick={() => setSuccessMessage(null)} />
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateMindmap;
