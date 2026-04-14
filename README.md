# Inbound Email CLI

An AI-first command-line tool for sending, receiving, and managing emails via the [inbound.new](https://inbound.new) API.

## Features

- **Send Emails**: Support for multiple recipients, CC, BCC, Reply-To, and attachments.
- **List & Filter**: View received, sent, or scheduled emails with filtering by address or search query.
- **Thread Management**: View grouped conversations and reply to specific threads.
- **Attachment Handling**: Download attachments directly to your local machine.
- **Webhook Integration**: Easily create and manage webhook endpoints for incoming mail.

## Installation

```bash
# Clone the repository
git clone https://github.com/Jaspreet84/inbound-mail-client.git
cd inbound-mail-client

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI (optional)
npm link
```

## Configuration

The CLI requires an API key from `inbound.new`. You can provide it in two ways:

1.  Create an `api.key` file in the project root containing your key.
2.  Set the `INBOUND_API_KEY` environment variable.

## Command Reference

The Inbound CLI uses **Options/Flags** (e.g., `--to`) for most inputs and **Positional Arguments** (e.g., `<id>`) only when specified.

### 1. `send`
Send a new email. All recipients must be preceded by their respective flags.
- **Flags:**
  - `-f, --from <email>` (**Required**): Verified sender address.
  - `-t, --to <email...>` (**Required**): One or more recipients.
  - `-s, --subject <text>` (**Required**): Email subject.
  - `--cc <email...>`, `--bcc <email...>`, `--reply-to <email...>`: Optional recipient lists.
  - `--text <text>`, `--html <html>`: Body content.
  - `-a, --attachment <path...>`: One or more local file paths.
- **Example:**
  ```bash
  inbound send -f admin@velor.pro -t user@gmail.com -s "Hello" --text "Body here"
  ```

### 2. `reply`
Reply to an existing email thread.
- **Arguments:** `<id>` (The ID of the email you are replying to).
- **Flags:**
  - `-f, --from <email>` (**Required**): Your verified sender address.
  - `--text <text>`, `--html <html>`, `-a, --attachment <path...>`: Reply content.
- **Example:**
  ```bash
  inbound reply inbnd_12345 -f admin@velor.pro --text "Got it, thanks!"
  ```

### 3. `listen`
Automated webhook.site integration.
- **Flags:**
  - `-a, --address <email>`: Optional. Automatically routes this address to the webhook.
  - `-t, --token <id>`: Optional. Use an existing webhook.site token.
  - `-i, --interval <seconds>`: Polling frequency (Default: 10).
  - `-n, --name <text>`: Name for the Inbound endpoint (Default: "CLI Listener").
- **Example:**
  ```bash
  inbound listen --address jaspreet@velor.pro --interval 5
  ```

### 4. `list`
List email activity.
- **Flags:**
  - `-a, --address <email>`: Filter by a specific email address.
  - `-t, --type <type>`: `all`, `sent`, `received`, `scheduled` (Default: `all`).
  - `-s, --search <query>`: Search subject/body.
  - `-l, --limit <number>`: Results per page (Default: 50).
- **Example:**
  ```bash
  inbound list --address jaspreet@velor.pro --type received
  ```

### 5. `download`
Download an attachment to your local machine.
- **Arguments:** `<id>` (Attachment/Email ID) and `<filename>`.
- **Flags:**
  - `-o, --output <path>`: Local directory to save the file (Default: `.`).
- **Example:**
  ```bash
  inbound download inbnd_12345 invoice.pdf -o ./downloads
  ```

### 6. `get`
Fetch the full JSON metadata for a specific email.
- **Arguments:** `<id>`.
- **Example:**
  ```bash
  inbound get inbnd_12345
  ```

### 7. `threads`
List email threads (conversations).
- **Flags:**
  - `-a, --address <email>`, `-s, --search <query>`, `-u, --unread`.
- **Example:**
  ```bash
  inbound threads --unread
  ```

### 8. `webhook`
Manually create a webhook endpoint.
- **Flags:**
  - `-n, --name <text>` (**Required**), `-u, --url <url>` (**Required**).
- **Example:**
  ```bash
  inbound webhook -n "My Server" -u "https://api.myapp.com/webhook"
  ```

## Development

```bash
npm run build   # Compile TypeScript
npm start       # Run directly via tsx (for development)
```

## License

MIT
