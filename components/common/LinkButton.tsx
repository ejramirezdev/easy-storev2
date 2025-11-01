"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import Link from "next/link";
import { forwardRef } from "react";

type LinkButtonProps = ButtonProps<typeof Link>;

const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton(props, ref) {
    return <Button {...props} component={Link} ref={ref} />;
  }
);

export default LinkButton;
