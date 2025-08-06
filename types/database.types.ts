Run code generation tools

Usage:
  supabase gen [command]

Available Commands:
  keys        Generate keys for preview branch
  signing-key Generate a JWT signing key
  types       Generate types from Postgres schema

Flags:
  -h, --help   help for gen

Global Flags:
      --create-ticket                                  create a support ticket for any CLI error
      --debug                                          output debug logs to stderr
      --dns-resolver [ native | https ]                lookup domain names using the specified resolver (default native)
      --experimental                                   enable experimental features
      --network-id string                              use the specified docker network instead of a generated one
  -o, --output [ env | pretty | json | toml | yaml ]   output format of status variables (default pretty)
      --workdir string                                 path to a Supabase project directory
      --yes                                            answer yes to all prompts

Use "supabase gen [command] --help" for more information about a command.
