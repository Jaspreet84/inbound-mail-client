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

## Core Capabilities

### 1. Sending Emails
Use the `send` command for new outbound messages.
- **Commands**: `inbound send -t <to> -f <from> -s <subject> --text <text> --html <html>`
- **Multiple Recipients**: Use multiple `-t` flags or comma-separated strings.
- **Attachments**: Pass local file paths using `-a <path>`.

### 2. Checking & Listing Messages
- **List All**: `inbound list --address <email> --type received`
- **Filtering**: Use `--type sent`, `received`, or `scheduled`.
- **Threads**: `inbound threads --address <email>` to see grouped conversations.

### 3. Retrieving & Downloading
- **Fetch Detail**: `inbound get <id>` (Required to see attachment metadata).
- **Download**: `inbound download <message_id> <filename> -o <output_dir>`.

### 4. Replying
- **Threading**: `inbound reply <id> -f <from> --text <text>`. This maintains the `thread_id` context automatically.

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
