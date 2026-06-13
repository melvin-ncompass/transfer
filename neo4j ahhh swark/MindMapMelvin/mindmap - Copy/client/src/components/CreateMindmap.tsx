import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Alert,
  Divider,
  Box,
} from "@mui/material";
import CustomButton from "./Atoms/CustomButton";
import CustomDropdown from "./Atoms/Dropdown";
import LoadingDialog from "./LoadingDialog";


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

  const [repos, setRepos] = useState<Repo[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedCommit, setSelectedCommit] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setInitialized(true);
  }, [query, navigate]);


  useEffect(() => {
    if (!initialized) return;
    const token = sessionStorage.getItem("access_token");
    console.log(token)
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
      {
        headers: { Authorization: `Bearer ${token}` },
      }
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

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <CustomButton
          label="Back to Login"
          variant="contained"
          color="primary"
          onClick={() => (window.location.href = "/")}
        />
      </Container>
    );
  }

  <LoadingDialog open={loading} message="Fetching data..." />;

  return (
    <>
      <Container sx={{ color: "#fff", placeItems: "center" }}>
        <LoadingDialog open={loading} message="Fetching data..." />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 2,
            position: "relative",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", textAlign: "center" }}
          >
            Create your Project
          </Typography>

          {/* <CustomButton
          label="SIGN OUT"
          variant="contained"
          sx={{
            bgcolor: "#eb6142ff",
            color: "#fff",
            fontWeight: "bold",
            position: "absolute", 
            right: 0, 
          }}
          onClick={handleSignOut}
        /> */}
        </Box>

        {repos && (
          <Card sx={{ mb: 2, bgcolor: "#22272eff", height: "8.2rem" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: "#ffffff" }}>
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
        {/* )} */}

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
      </Container>
    </>
  );
};

export default CreateMindmap;
