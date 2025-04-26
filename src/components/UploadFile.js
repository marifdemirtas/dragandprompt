import React from "react";
import { Button } from "@mui/material";
import UploadIcon from '@mui/icons-material/Upload';

const UploadFile = ({ onFileUpload }) => {
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      onFileUpload(data);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input
        id="file-upload"
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
    </>
  );
};

export default UploadFile;