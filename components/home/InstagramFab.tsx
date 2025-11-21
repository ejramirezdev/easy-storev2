"use client";
import { Fab } from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";

export default function InstagramFab({
  url = "https://www.instagram.com/easystoreecu/",
}: {
  url?: string;
}) {
  return (
    <Fab
      color="secondary"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      sx={{
        position: "fixed",
        right: 20,
        bottom: 100,
        zIndex: 1300,
        background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
        "&:hover": {
          background: "linear-gradient(45deg, #bc1888 0%, #cc2366 25%, #dc2743 50%, #e6683c 75%, #f09433 100%)",
        },
      }}
    >
      <InstagramIcon />
    </Fab>
  );
}

