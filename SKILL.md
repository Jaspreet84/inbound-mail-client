---
name: inbound_email_manager
description: AI-first tool for sending, receiving, and managing emails with attachment support.
metadata:
  openclaw:
    requires:
      - node
      - npm
---

# Inbound Email Management Skill

This skill enables an AI agent to programmatically send, receive, and manage emails using the `inbound` CLI tool. It is optimized for transactional email workflows, attachment handling, and thread management.

## Setup & Prerequisites

1.  **API Key**: Ensure an `api.key` file exists in the project root or the `INBOUND_API_KEY` environment variable is set.
2.  **Tool Availability**: The tool should be built and accessible via `node dist/index.js` or linked as `inbound`.

## Core Capabilities & Syntax

All commands follow the pattern: `inbound <command> [arguments] [options]`. Options/Flags (like `-t`) are mandatory for most inputs.

### 1. Sending Emails
- **Command**: `inbound send -f <from> -t <to> -s <subject> [options]`
- **Mandatory Flags**:
  - `-f, --from`: The verified sender email.
  - `-t, --to`: One or more recipient emails.
  - `-s, --subject`: Email subject line.
- **Example**: `inbound send -f admin@velor.pro -t user@example.com -s "Test"`

### 2. Automated Listening (Webhook.site)
- **Command**: `inbound listen [options]`
- **Options**:
  - `-a, --address <email>`: Link this address to the webhook.
  - `-i, --interval <seconds>`: Poll frequency (default 10).
  - `-t, --token <id>`: Use an existing webhook.site token.
- **Example**: `inbound listen --address user@velor.pro`

### 3. Checking & Retrieving
- **List All**: `inbound list -a <email> -t received`
- **Fetch Metadata**: `inbound get <id>` (Required to see attachment names).
- **Download**: `inbound download <id> <filename> -o <output_dir>`
  - *Note*: `<id>` and `<filename>` are positional arguments. Do NOT use flags for them.

### 4. Replying
- **Command**: `inbound reply <id> -f <from> [options]`
- **Arguments**: `<id>` (Positional).
- **Mandatory Flags**: `-f, --from`.

### 5. Proxy Testing
- **Command**: `inbound test-proxy`
- **Purpose**: Verify if `http_proxy` / `https_proxy` are working by attempting to fetch the EICAR malware test file (which should be blocked).

## Operational Rules & Validation

Based on workspace conventions, agents must adhere to the following validation logic before execution:

### Email Validation & Policy
- **Format**: Validate emails using standard regex (`/^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,})$/`).
- **CC Lists**: When preparing CC lists for external system records (like CRM fields), prefer **semicolon (;) separation** over commas, as per local `checkemail()` logic.
- **Domain Blocking**: Do not send to or process "Public Email" domains (e.g., gmail.com, outlook.com) if the task involves strict corporate/private data exchange, unless explicitly authorized.

### Workflow: Checking for Attachments
1.  Run `inbound list --address <email> --type received`.
2.  Identify messages where `has_attachments: true`.
3.  Run `inbound get <id>` to retrieve the `filename`.
4.  Run `inbound download <id> <filename>` to process the file.

## Example Usage

**Goal**: Reply to a specific customer with a quote PDF.
```bash
# 1. Reply to the thread
inbound reply inbnd_12345 -f admin@velor.pro --text "Please find the quote attached." -a ./documents/quote.pdf
```

**Goal**: Check for DNS records sent to the admin.
```bash
# 1. Find the email
inbound list --address admin@velor.pro --search "DNS"
# 2. Get details
inbound get inbnd_abcde
# 3. Download
inbound download inbnd_abcde zone_records.txt
```
