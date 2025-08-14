import { promisify } from 'node:util';
import { execFile, spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType
} from 'n8n-workflow';

const pExecFile = promisify(execFile);

export class DarkAuggie implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Dark Auggie',
    name: 'darkAuggie',
    icon: 'file:dark-auggie.svg',
    group: ['transform'],
    version: 1,
    subtitle: 'Execute Auggie CLI',
    description: 'Wraps the Augment Code Auggie CLI for automated workflows',
    defaults: {
      name: 'Dark Auggie'
    },
    // Use string literal to avoid runtime import issues across n8n versions
    inputs: ['main' as NodeConnectionType],
    outputs: ['main' as NodeConnectionType],
    credentials: [
      {
        name: 'augmentApi',
        required: true
      }
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Run CLI', value: 'runCli', description: 'Run a raw Auggie CLI command' },
          { name: 'Quick Print', value: 'print', description: 'auggie --print/--quiet/--compact one-shot' },
          {
            name: 'Interactive Step',
            value: 'interactive',
            description: 'Provide initial instruction to interactive mode (non-TTY)'
          }
        ],
        default: 'runCli'
      },
      // Run CLI specific
      {
        displayName: 'Command',
        name: 'command',
        type: 'string',
        default: 'auggie',
        description: 'Command to execute, typically "auggie"',
        displayOptions: { show: { operation: ['runCli'] } }
      },
      {
        displayName: 'Arguments',
        name: 'args',
        type: 'string',
        default: '--help',
        description: 'Arguments to pass to the command (e.g., --print "Summarize this repo")',
        displayOptions: { show: { operation: ['runCli'] } }
      },
      // Print / Interactive
      {
        displayName: 'Print Mode',
        name: 'printMode',
        type: 'options',
        options: [
          { name: 'Print', value: 'print' },
          { name: 'Quiet', value: 'quiet' },
          { name: 'Compact', value: 'compact' }
        ],
        default: 'print',
        displayOptions: { show: { operation: ['print'] } }
      },
      {
        displayName: 'Instruction',
        name: 'instruction',
        type: 'string',
        default: 'Summarize the staged changes',
        description: 'Text sent to auggie via --print or as initial instruction',
        displayOptions: { show: { operation: ['print', 'interactive'] } }
      },
      {
        displayName: 'Continue Previous Session',
        name: 'continuePrevious',
        type: 'boolean',
        default: false,
        description: 'Add --continue to resume previous conversation',
        displayOptions: { show: { operation: ['interactive'] } }
      },
      {
        displayName: "Don't Save Session",
        name: 'dontSaveSession',
        type: 'boolean',
        default: false,
        description: 'Add --dont-save-session to prevent saving to history',
        displayOptions: { show: { operation: ['interactive'] } }
      },
      // Common config
      {
        displayName: 'Workspace Root',
        name: 'workspaceRoot',
        type: 'string',
        default: '',
        description: 'Pass --workspace-root to set the project root'
      },
      {
        displayName: 'Rules File Path',
        name: 'rulesPath',
        type: 'string',
        default: '',
        description: 'Pass --rules with path to additional rules file'
      },
      {
        displayName: 'MCP Config Source',
        name: 'mcpConfigSource',
        type: 'options',
        options: [
          { name: 'None', value: 'none' },
          { name: 'Inline JSON', value: 'inline' },
          { name: 'File Path', value: 'file' },
          { name: 'From JSON Path', value: 'jsonPath' }
        ],
        default: 'none',
        description: 'Provide MCP config as JSON, file path, or from item JSON'
      },
      {
        displayName: 'MCP JSON',
        name: 'mcpJson',
        type: 'string',
        default: '',
        description: 'Inline MCP JSON string',
        displayOptions: { show: { mcpConfigSource: ['inline'] } }
      },
      {
        displayName: 'MCP Config File Path',
        name: 'mcpFile',
        type: 'string',
        default: '',
        description: 'Path to MCP JSON file',
        displayOptions: { show: { mcpConfigSource: ['file'] } }
      },
      {
        displayName: 'MCP JSON Path',
        name: 'mcpJsonPath',
        type: 'string',
        default: '',
        description: 'Dot path to JSON field on the input item that contains MCP JSON',
        displayOptions: { show: { mcpConfigSource: ['jsonPath'] } }
      },
      // Stdin
      {
        displayName: 'Stdin Source',
        name: 'stdinSource',
        type: 'options',
        options: [
          { name: 'None', value: 'none' },
          { name: 'From JSON Path', value: 'jsonPath' },
          { name: 'Binary Property', value: 'binary' }
        ],
        default: 'none'
      },
      {
        displayName: 'Stdin JSON Path',
        name: 'stdinJsonPath',
        type: 'string',
        default: '',
        description: 'Dot path to JSON field on the input item that should be piped to stdin',
        displayOptions: { show: { stdinSource: ['jsonPath'] } }
      },
      {
        displayName: 'Stdin Binary Property',
        name: 'stdinBinaryProperty',
        type: 'string',
        default: '',
        description: 'Binary property name to pipe to stdin',
        displayOptions: { show: { stdinSource: ['binary'] } }
      },
      // Env injection
      {
        displayName: 'Additional Env (JSON)',
        name: 'additionalEnvJson',
        type: 'string',
        default: '',
        description: 'Additional environment variables as a JSON object {"KEY":"VALUE"}'
      },
      {
        displayName: 'Working Directory',
        name: 'cwd',
        type: 'string',
        default: '',
        description: 'Optional working directory for the CLI'
      },
      {
        displayName: 'Timeout (ms)',
        name: 'timeout',
        type: 'number',
        typeOptions: { minValue: 0 },
        default: 600000,
        description: 'Process timeout in milliseconds'
      }
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const operation = this.getNodeParameter('operation', 0) as string;
    const cwdParam = (this.getNodeParameter('cwd', 0) as string) || process.cwd();
    const timeout = (this.getNodeParameter('timeout', 0) as number) || 600000;

    const creds = await this.getCredentials('augmentApi');
    const env: NodeJS.ProcessEnv = { ...process.env };
    if (creds.augmentSessionAuth) env.AUGMENT_SESSION_AUTH = String(creds.augmentSessionAuth);
    if (creds.augmentApiUrl) env.AUGMENT_API_URL = String(creds.augmentApiUrl);
    if (creds.augmentApiToken) env.AUGMENT_API_TOKEN = String(creds.augmentApiToken);
    if (creds.githubApiToken) env.GITHUB_API_TOKEN = String(creds.githubApiToken);

    // Merge additional env from parameter JSON
    const additionalEnvJson = (this.getNodeParameter('additionalEnvJson', 0) as string) || '';
    if (additionalEnvJson) {
      try {
        const obj = JSON.parse(additionalEnvJson);
        Object.entries(obj).forEach(([k, v]) => {
          env[String(k)] = String(v as any);
        });
      } catch {
        // ignore parse error; user will see it in output if command fails
      }
    }

    // Resolve auggie binary locally if possible
    const localBin = path.join(process.cwd(), 'node_modules', '.bin', 'auggie');
    const auggieCmd = fs.existsSync(localBin) ? localBin : 'auggie';

    // Common flag assembly
    const workspaceRoot = (this.getNodeParameter('workspaceRoot', 0) as string) || '';
    const rulesPath = (this.getNodeParameter('rulesPath', 0) as string) || '';
    const mcpConfigSource = (this.getNodeParameter('mcpConfigSource', 0) as string) || 'none';

    const buildCommonFlags = (i: number): string[] => {
      const flags: string[] = [];
      if (workspaceRoot) {
        flags.push('--workspace-root', workspaceRoot);
      }
      if (rulesPath) {
        flags.push('--rules', rulesPath);
      }
      if (mcpConfigSource === 'inline') {
        const mcpJson = (this.getNodeParameter('mcpJson', i) as string) || '';
        if (mcpJson) flags.push('--mcp-config', mcpJson);
      } else if (mcpConfigSource === 'file') {
        const mcpFile = (this.getNodeParameter('mcpFile', i) as string) || '';
        if (mcpFile) flags.push('--mcp-config', mcpFile);
      } else if (mcpConfigSource === 'jsonPath') {
        const mcpJsonPath = (this.getNodeParameter('mcpJsonPath', i) as string) || '';
        if (mcpJsonPath) {
          const item = items[i];
          const value: any = mcpJsonPath
            .split('.')
            .reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), item?.json as any);
          if (value !== undefined && value !== null) {
            flags.push('--mcp-config', typeof value === 'string' ? value : JSON.stringify(value));
          }
        }
      }
      return flags;
    };

    // stdin assembly per item
    const resolveStdin = (i: number): Buffer | undefined => {
      const stdinSource = (this.getNodeParameter('stdinSource', i) as string) || 'none';
      if (stdinSource === 'jsonPath') {
        const p = (this.getNodeParameter('stdinJsonPath', i) as string) || '';
        if (p) {
          // getNodeParameter can read expression; for arbitrary json path, fallback to item.json
          const val = this.getNodeParameter(p, i, undefined) as any;
          const item = items[i];
          const fallback = p
            .split('.')
            .reduce((acc: any, key: string) => (acc ? acc[key] : undefined), item.json as any);
          const data = val ?? fallback;
          if (data !== undefined && data !== null)
            return Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
        }
      } else if (stdinSource === 'binary') {
        const binProp = (this.getNodeParameter('stdinBinaryProperty', i) as string) || '';
        if (binProp && items[i].binary?.[binProp]?.data) {
          return Buffer.from(items[i].binary![binProp].data, 'base64');
        }
      }
      return undefined;
    };

    for (let i = 0; i < items.length; i++) {
      try {
        const stdinData = resolveStdin.call(this, i);
        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        if (operation === 'runCli') {
          const command = (this.getNodeParameter('command', i) as string) || auggieCmd;
          const args = (this.getNodeParameter('args', i) as string) || '';
          const argv = args.trim() ? args.match(/(?:[^\s"]+|"[^"]*")+/g) || [] : [];
          const fullArgv = argv.map((s) => s.replace(/^"|"$/g, ''));
          const res = await pExecFile(command, fullArgv, { env, cwd: cwdParam, timeout, maxBuffer: 1024 * 1024 * 50 });
          stdout = res.stdout?.toString() ?? '';
          stderr = res.stderr?.toString() ?? '';
          exitCode = (res as any).status ?? 0;
        } else if (operation === 'print') {
          const instruction = (this.getNodeParameter('instruction', i) as string) || '';
          const printMode = (this.getNodeParameter('printMode', i) as string) || 'print';
          const modeArgs = printMode === 'quiet' ? ['--quiet'] : printMode === 'compact' ? ['--compact'] : ['--print'];
          const flags = buildCommonFlags.call(this, i);

          // Use spawn to support piping stdin
          const child = spawn(auggieCmd, [...modeArgs, instruction, ...flags], { env, cwd: cwdParam, stdio: 'pipe' });
          const chunks: Buffer[] = [];
          const errChunks: Buffer[] = [];
          child.stdout?.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
          child.stderr?.on('data', (c) => errChunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
          await new Promise<void>((resolve, reject) => {
            if (stdinData) child.stdin?.write(stdinData);
            child.stdin?.end();
            child.on('close', (code) => {
              exitCode = code ?? 0;
              resolve();
            });
            child.on('error', (e) => reject(e));
          });
          stdout = Buffer.concat(chunks).toString('utf8');
          stderr = Buffer.concat(errChunks).toString('utf8');
        } else if (operation === 'interactive') {
          const instruction = (this.getNodeParameter('instruction', i) as string) || '';
          const continuePrevious = this.getNodeParameter('continuePrevious', i) as boolean;
          const dontSaveSession = this.getNodeParameter('dontSaveSession', i) as boolean;
          const flags = buildCommonFlags.call(this, i);
          if (continuePrevious) flags.unshift('--continue');
          if (dontSaveSession) flags.unshift('--dont-save-session');

          const child = spawn(auggieCmd, ['--instruction', instruction, ...flags], {
            env,
            cwd: cwdParam,
            stdio: 'pipe'
          });
          const chunks: Buffer[] = [];
          const errChunks: Buffer[] = [];
          child.stdout?.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
          child.stderr?.on('data', (c) => errChunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
          await new Promise<void>((resolve, reject) => {
            if (stdinData) child.stdin?.write(stdinData);
            child.stdin?.end();
            child.on('close', (code) => {
              exitCode = code ?? 0;
              resolve();
            });
            child.on('error', (e) => reject(e));
          });
          stdout = Buffer.concat(chunks).toString('utf8');
          stderr = Buffer.concat(errChunks).toString('utf8');
        }

        const out: any = { success: exitCode === 0, stdout, stderr, exitCode };
        if (operation === 'print') {
          const printMode = (this.getNodeParameter('printMode', i) as string) || 'print';
          if (printMode === 'compact') {
            out.compactLines = stdout.split(/\r?\n/).filter(Boolean);
          }
        }
        returnData.push({ json: out });
      } catch (error: any) {
        returnData.push({
          json: {
            success: false,
            error: error.message || 'Unknown error',
            code: error.code,
            stdout: error.stdout?.toString?.() || '',
            stderr: error.stderr?.toString?.() || ''
          }
        });
      }
    }

    return [returnData];
  }
}
