import React, { useState, useRef, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Alert,
  Box,
  Snackbar,
  Stack,
  Typography,
  type SnackbarCloseReason,
} from "@mui/material";
import { FileUploadField } from "../../../../components/atom/file-upload-field";
import { PrimaryButton } from "../../../../components/atom/button";
import { useAppDispatch } from "../../../../store/store";
// import { setPfp } from "../profileSlice";
// import { useUploadProfilePicMutation } from "../../api/profile.api";
import { canvasPreview } from "../../../auth/profilePage/utils/CanvasPreview";

interface ImageCropperProps {
  onCropComplete: (croppedImage: File) => void;
  aspectRatio?: number; 
}

export const ImageCropper = ({ onCropComplete, aspectRatio }: ImageCropperProps) => {
  const dispatch = useAppDispatch();
  // const [uploadAPI] = useUploadProfilePicMutation();
  const [open, setOpen] = useState(false);
  const [upImg, setUpImg] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "px",
    width: 100,
    x: 0,
    y: 0,
    height: 100,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);

  // Read the uploaded file
  const onSelectFile = (file: File | File [] | null) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => setUpImg(reader.result as string));
    if(file instanceof File){
      reader.readAsDataURL(file);
    }
  };
  function base64ToFile(base64: string, fileName: string) {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new File([u8arr], fileName, { type: mime });
  }

  // Save cropped image to parent
  const onSaveCrop = async () => {
    if (!completedCrop || !previewCanvasRef.current) return;

    const base64Image = previewCanvasRef.current.toDataURL("image/jpeg");
    // onCropComplete(base64Image);

    try {
      // Convert Base64 → File
      const file = base64ToFile(base64Image, "profile.jpg");

      // Prepare FormData
      const formData = new FormData();
      formData.append("image", file);

      // Dispatch local preview
      // dispatch(setPfp(base64Image));
      onCropComplete(file);
      // Upload to server
      // const res = await uploadAPI(formData).unwrap();

      // Local storage save
      localStorage.setItem("croppedImage", base64Image);

      setOpen(true);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      canvasPreview(imgRef.current, previewCanvasRef.current, completedCrop);
    }
  }, [completedCrop]);

  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };
  return (
    <Box>
      {/* <input type="file" accept="image/*" onChange={onSelectFile} /> */}
      <Stack direction={"row"} alignItems={"center"} gap={1}>
        <FileUploadField accept="image/*" label="Choose Image" onChange={onSelectFile}   />
        <Typography variant="caption">supports .jpg, .png, .jpeg</Typography>
      </Stack>
      {
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "10px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              flex: "1",
              width: "100%",
              height: "45vh",
              border: "1px solid #ccc",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {upImg ? (
              <ReactCrop
                // circularCrop={!aspectRatio? true : false}
                crop={crop}
                onChange={(newCrop) => setCrop(newCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                style={{ maxWidth: "100%", maxHeight: "30vh" }}
              >
                <img
                  ref={imgRef}
                  alt="No Image Uploaded"
                  src={upImg!}
                  style={{
                    // borderRadius:"50%",
                    width: upImg ? "100%" : "100px",
                    height: upImg ? "100%" : "100px",
                    objectFit: "cover",
                  }}
                  onLoad={(e) => {
                    imgRef.current = e.currentTarget;
                    setCompletedCrop({
                      unit: "px",
                      x: crop.x,
                      y: crop.y,
                      width: crop.width,
                      height: crop.height,
                    });
                  }}
                />
              </ReactCrop>
            ) : (
              <Box>No Image Uploaded</Box>
            )}
          </div>

          {upImg ? (
            <Box flex={1} justifyContent={"center"} display={"flex"}>
              <canvas
                ref={previewCanvasRef}
                style={{
                  // flex: "1",
                  // borderRadius: "500%", // <-- makes it a circle
                  border: "1px solid #ccc",
                  objectFit: "contain",
                  width: !aspectRatio ? "44vh" : "100%",
                  height: !aspectRatio ? "22vh" : "100%", // same as width for circle
                  overflow: "hidden",
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                flex: "1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid #ccc",
                objectFit: "contain",
                width: completedCrop?.width ?? 0,
                height: "45vh",
              }}
            >
              Preview
            </Box>
          )}
        </div>
      }
      <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setOpen(false)}
        >
          Cropped image saved successfully!
        </Alert>
      </Snackbar>
      {
        <Box display={"flex"} justifyContent={"end"} gap={2}>
          <PrimaryButton
            onClick={onSaveCrop}
            style={{
              marginTop: "5px",
              backgroundColor: "#007bff",
              color: "white",
              padding: "8px 16px",
              border: "none",
              // borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Save
          </PrimaryButton>
        </Box>
      }
    </Box>
  );
};
