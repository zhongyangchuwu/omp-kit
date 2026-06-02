#!/usr/bin/env python3
"""Convert PPTX to PDF and preview image for paper-diagram QA.

Usage:
    python3 pptx_export.py output.pptx              # → output.pdf + output.jpg
    python3 pptx_export.py output.pptx --dpi 150    # lower DPI for quick preview
    python3 pptx_export.py output.pptx --only pdf   # PDF only, no image

Requires: LibreOffice (soffice) and Poppler (pdftoppm).
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

# ---------------------------------------------------------------------------
# LibreOffice sandbox helper (localized from anthropic-skills/pptx)
# ---------------------------------------------------------------------------

def _needs_af_unix_shim() -> bool:
    """Check whether AF_UNIX sockets are blocked (e.g., sandboxed VMs)."""
    import socket
    try:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.close()
        return False
    except OSError:
        return True


def _get_soffice_env() -> dict:
    """Build environment dict for soffice with sandbox workaround if needed."""
    env = os.environ.copy()
    env["SAL_USE_VCLPLUGIN"] = "svp"

    if _needs_af_unix_shim():
        shim = _build_af_unix_shim()
        env["LD_PRELOAD"] = str(shim)

    return env


def _build_af_unix_shim() -> Path:
    """Compile and cache the AF_UNIX socket shim shared library."""
    shim_so = Path(tempfile.gettempdir()) / "lo_socket_shim.so"
    if shim_so.exists():
        return shim_so

    src = Path(tempfile.gettempdir()) / "lo_socket_shim.c"
    src.write_text(_SHIM_SOURCE)
    subprocess.run(
        ["gcc", "-shared", "-fPIC", "-o", str(shim_so), str(src), "-ldl"],
        check=True, capture_output=True,
    )
    src.unlink()
    return shim_so


_SHIM_SOURCE = r"""
#define _GNU_SOURCE
#include <dlfcn.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <unistd.h>

static int (*real_socket)(int, int, int);
static int (*real_socketpair)(int, int, int, int[2]);
static int (*real_listen)(int, int);
static int (*real_accept)(int, struct sockaddr *, socklen_t *);
static int (*real_close)(int);
static int (*real_read)(int, void *, size_t);

static int is_shimmed[1024];
static int peer_of[1024];
static int wake_r[1024];
static int wake_w[1024];
static int listener_fd = -1;

__attribute__((constructor))
static void init(void) {
    real_socket     = dlsym(RTLD_NEXT, "socket");
    real_socketpair = dlsym(RTLD_NEXT, "socketpair");
    real_listen     = dlsym(RTLD_NEXT, "listen");
    real_accept     = dlsym(RTLD_NEXT, "accept");
    real_close      = dlsym(RTLD_NEXT, "close");
    real_read       = dlsym(RTLD_NEXT, "read");
    for (int i = 0; i < 1024; i++) {
        peer_of[i] = -1;
        wake_r[i]  = -1;
        wake_w[i]  = -1;
    }
}

int socket(int domain, int type, int protocol) {
    if (domain == AF_UNIX) {
        int fd = real_socket(domain, type, protocol);
        if (fd >= 0) return fd;
        int sv[2];
        if (real_socketpair(domain, type, protocol, sv) == 0) {
            if (sv[0] >= 0 && sv[0] < 1024) {
                is_shimmed[sv[0]] = 1;
                peer_of[sv[0]]    = sv[1];
                int wp[2];
                if (pipe(wp) == 0) {
                    wake_r[sv[0]] = wp[0];
                    wake_w[sv[0]] = wp[1];
                }
            }
            return sv[0];
        }
        errno = EPERM;
        return -1;
    }
    return real_socket(domain, type, protocol);
}

int listen(int sockfd, int backlog) {
    if (sockfd >= 0 && sockfd < 1024 && is_shimmed[sockfd]) {
        listener_fd = sockfd;
        return 0;
    }
    return real_listen(sockfd, backlog);
}

int accept(int sockfd, struct sockaddr *addr, socklen_t *addrlen) {
    if (sockfd >= 0 && sockfd < 1024 && is_shimmed[sockfd]) {
        if (wake_r[sockfd] >= 0) {
            char buf;
            real_read(wake_r[sockfd], &buf, 1);
        }
        errno = ECONNABORTED;
        return -1;
    }
    return real_accept(sockfd, addr, addrlen);
}

int close(int fd) {
    if (fd >= 0 && fd < 1024 && is_shimmed[fd]) {
        int was_listener = (fd == listener_fd);
        is_shimmed[fd] = 0;
        if (wake_w[fd] >= 0) {
            char c = 0;
            write(wake_w[fd], &c, 1);
            real_close(wake_w[fd]);
            wake_w[fd] = -1;
        }
        if (wake_r[fd] >= 0) { real_close(wake_r[fd]); wake_r[fd]  = -1; }
        if (peer_of[fd] >= 0) { real_close(peer_of[fd]); peer_of[fd] = -1; }
        if (was_listener) _exit(0);
    }
    return real_close(fd);
}
"""

# ---------------------------------------------------------------------------
# Conversion pipeline
# ---------------------------------------------------------------------------

def pptx_to_pdf(pptx_path: Path, output_dir: Path) -> Path:
    """Convert PPTX to PDF via LibreOffice headless."""
    pdf_path = output_dir / f"{pptx_path.stem}.pdf"

    result = subprocess.run(
        [
            "soffice",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", str(output_dir),
            str(pptx_path),
        ],
        capture_output=True,
        text=True,
        env=_get_soffice_env(),
    )

    if result.returncode != 0:
        stderr = result.stderr.strip()
        raise RuntimeError(
            f"soffice PDF conversion failed (exit {result.returncode}):\n{stderr}"
        )

    if not pdf_path.exists():
        raise RuntimeError(f"PDF not created at {pdf_path}")

    return pdf_path


def pdf_to_images(pdf_path: Path, output_dir: Path, dpi: int = 300) -> list[Path]:
    """Convert PDF pages to JPEG images via pdftoppm."""
    prefix = output_dir / pdf_path.stem
    result = subprocess.run(
        ["pdftoppm", "-jpeg", "-r", str(dpi), str(pdf_path), str(prefix)],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        stderr = result.stderr.strip()
        raise RuntimeError(
            f"pdftoppm conversion failed (exit {result.returncode}):\n{stderr}"
        )

    images = sorted(output_dir.glob(f"{pdf_path.stem}-*.jpg"))
    if not images:
        raise RuntimeError(f"No images produced from {pdf_path}")

    return images


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Convert PPTX to PDF and preview image for paper-diagram QA."
    )
    parser.add_argument("pptx", type=Path, help="Path to .pptx file")
    parser.add_argument("--dpi", type=int, default=300,
                        help="DPI for preview image (default: 300)")
    parser.add_argument("--only", choices=["pdf", "image"], default=None,
                        help="Produce only PDF or only image")
    args = parser.parse_args()

    pptx_path = args.pptx.resolve()
    if not pptx_path.exists():
        print(f"Error: {pptx_path} not found", file=sys.stderr)
        sys.exit(1)
    if pptx_path.suffix.lower() != ".pptx":
        print(f"Error: {pptx_path} is not a .pptx file", file=sys.stderr)
        sys.exit(1)

    output_dir = pptx_path.parent

    # Step 1: PPTX → PDF
    if args.only != "image":
        print(f"Converting {pptx_path.name} → PDF ...")
        pdf_path = pptx_to_pdf(pptx_path, output_dir)
        print(f"  → {pdf_path.name}")

    # Step 2: PDF → images
    if args.only != "pdf":
        pdf_path = output_dir / f"{pptx_path.stem}.pdf"
        if not pdf_path.exists():
            pptx_to_pdf(pptx_path, output_dir)

        print(f"Converting PDF → images ({args.dpi} DPI) ...")
        images = pdf_to_images(pdf_path, output_dir, dpi=args.dpi)

        # For single-image output, rename first image to <stem>.jpg
        if len(images) == 1:
            target = output_dir / f"{pptx_path.stem}.jpg"
            images[0].rename(target)
            print(f"  → {target.name}")
        else:
            for img in images:
                print(f"  → {img.name}")

    print("Done.")


if __name__ == "__main__":
    main()
