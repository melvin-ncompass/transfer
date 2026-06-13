import { Avatar } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { useNavigate, useParams } from "react-router-dom";
import { PrimaryIconButton } from "../../../../../../components/atom/button";
import { ArrowBack, AttachFile, MoreVert, Send } from "@mui/icons-material";
import TipTapEditor from "../../../../home/ClockInOut/components/TiptapEditor";
import { SingleSelectElement } from "../../../../../../components/atom/select-field/SingleSelect";

function Chat() {
  const queryParams = useParams();
  const navigate = useNavigate();
  console.log(queryParams);
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        // bgcolor: "lightblue",
        border: "1px solid #ccc",
        borderRadius: 2,
        // p:1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* header */}
      <Box
        width={"100%"}
        sx={{
          backgroundColor: "secondary.main",
          color: "secondary.contrastText",
          padding: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 2,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <Stack direction={"row"} display={"flex"} alignItems={"center"} gap={1}>
          <PrimaryIconButton icon={<ArrowBack/>} variant="outlined" onClick={()=>{navigate(-1)}}/>
          <Avatar />
          {queryParams.id}
        </Stack>
        <PrimaryIconButton icon={<MoreVert />} variant="outlined" />
      </Box>
      {/* chat */}
      <Box flex={1} sx={{ overflowY: "scroll" }}></Box>
      {/* input */}
      <Box
        sx={{
          backgroundColor: "white",
          borderTop: "1px sold #ccc",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 1,
          gap:1
        }}
      >
        <Box width={"70%"} borderRadius={2}>
          <TipTapEditor />
        </Box>
        <Box width={"30%"}>
          <SingleSelectElement
            label={"Response Templates"}
            value={""}
            onChange={(val) => {
              console.log(val);
            }}
            options={[]}
            sx={{ width: "100%" }}
          />
          <Box width={"100%"} display={"flex"} gap={1} justifyContent={"end"} my={1}>
            <PrimaryIconButton icon={<AttachFile />} />
            <PrimaryIconButton icon={<Send />} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default Chat;
