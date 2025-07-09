// @ts-nocheck
import {
  WASI,
  OpenFile,
  File,
  ConsoleStdout,
  PreopenDirectory,
} from "@bjorn3/browser_wasi_shim";

let pandocInstance: any = null;

export async function initPandoc() {
  if (pandocInstance) return pandocInstance;

  const args = ["pandoc.wasm", "+RTS", "-H64m", "-RTS"];
  const env: string[] = [];
  const in_file = new File(new Uint8Array(), { readonly: false }); // Make writable
  const out_file = new File(new Uint8Array(), { readonly: false });
  const fds = [
    new OpenFile(new File(new Uint8Array(), { readonly: true })),
    ConsoleStdout.lineBuffered((msg: any) => console.log(`[WASI stdout] ${msg}`)),
    ConsoleStdout.lineBuffered((msg: any) => console.warn(`[WASI stderr] ${msg}`)),
    new PreopenDirectory("/", [
      ["in", in_file],
      ["out", out_file],
    ]),
  ];
  const options = { debug: false };
  const wasi = new WASI(args, env, fds, options);
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch("/pandoc.wasm"),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
    }
  );

  wasi.initialize(instance);
  // @ts-ignore
  instance.exports.__wasm_call_ctors();

  function memory_data_view() {
    // @ts-ignore
    return new DataView(instance.exports.memory.buffer);
  }

  // @ts-ignore
  const argc_ptr = instance.exports.malloc(4);
  memory_data_view().setUint32(argc_ptr, args.length, true);
  // @ts-ignore
  const argv = instance.exports.malloc(4 * (args.length + 1));
  for (let i = 0; i < args.length; ++i) {
    // @ts-ignore
    const arg = instance.exports.malloc(args[i].length + 1);
    new TextEncoder().encodeInto(
      args[i],
      // @ts-ignore
      new Uint8Array(instance.exports.memory.buffer, arg, args[i].length)
    );
    memory_data_view().setUint8(arg + args[i].length, 0);
    memory_data_view().setUint32(argv + 4 * i, arg, true);
  }
  memory_data_view().setUint32(argv + 4 * args.length, 0, true);
  // @ts-ignore
  const argv_ptr = instance.exports.malloc(4);
  memory_data_view().setUint32(argv_ptr, argv, true);

  // @ts-ignore
  instance.exports.hs_init_with_rtsopts(argc_ptr, argv_ptr);

  pandocInstance = {
    instance,
    in_file,
    out_file,
    convert: function (args_str: string, in_str: string) {
      // @ts-ignore
      const args_ptr = instance.exports.malloc(args_str.length);
      new TextEncoder().encodeInto(
        args_str,
        // @ts-ignore
        new Uint8Array(instance.exports.memory.buffer, args_ptr, args_str.length)
      );
      in_file.data = new TextEncoder().encode(in_str);
      // @ts-ignore
      instance.exports.wasm_main(args_ptr, args_str.length);
      return new TextDecoder("utf-8", { fatal: true }).decode(out_file.data);
    }
  };

  return pandocInstance;
}

export async function convertWithPandoc(args: string, input: string): Promise<string> {
  const pandoc = await initPandoc();
  
  // Check if this is a binary format based on the arguments
  const isBinaryFormat = args.includes('-f docx') || args.includes('-f odt') || args.includes('-f epub');
  
  console.log('Converting with args:', args);
  console.log('Is binary format:', isBinaryFormat);
  console.log('Input length:', input.length);
  
  if (isBinaryFormat) {
    // For binary formats, input should be base64-encoded
    try {
      // Validate base64 string first
      if (!isValidBase64(input)) {
        throw new Error('Invalid base64 string provided');
      }
      
      // Decode base64 to binary data using a safer method
      const bytes = base64ToUint8Array(input);
      
      console.log('Decoded binary data length:', bytes.length);
      
      // Verify the binary data looks like a ZIP file (ODT/DOCX are ZIP containers)
      if (bytes.length >= 4) {
        const header = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('File header (hex):', header);
        
        // Check for ZIP signature (504B0304 or 504B0506)
        if (!header.startsWith('504b03') && !header.startsWith('504b05')) {
          console.warn('Warning: File does not appear to be a valid ZIP archive');
        }
      }
      
      // Try a different approach: use the convert function but override the data handling
      const originalConvert = pandoc.convert;
      pandoc.convert = function(args_str: string, in_str: string) {
        // @ts-ignore
        const args_ptr = pandoc.instance.exports.malloc(args_str.length);
        new TextEncoder().encodeInto(
          args_str,
          // @ts-ignore
          new Uint8Array(pandoc.instance.exports.memory.buffer, args_ptr, args_str.length)
        );
        
        // Set binary data directly instead of encoding as UTF-8
        pandoc.in_file.data = bytes;
        
        // @ts-ignore
        pandoc.instance.exports.wasm_main(args_ptr, args_str.length);
        return new TextDecoder("utf-8", { fatal: true }).decode(pandoc.out_file.data);
      };
      
      // Reset output file
      pandoc.out_file.data = new Uint8Array();
      
      // Use standard args format (let pandoc handle the input automatically)
      const result = pandoc.convert(args, '');
      
      // Restore original function
      pandoc.convert = originalConvert;
      
      console.log('Conversion result length:', result.length);
      return result;
    } catch (error) {
      console.error('Error processing binary format:', error);
      throw new Error(`Failed to process binary file: ${error.message}`);
    }
  } else {
    // For text formats, use the standard convert function
    return pandoc.convert(args, input);
  }
}

// Helper function to validate base64 string
function isValidBase64(str: string): boolean {
  try {
    // Check if string contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(str)) {
      return false;
    }
    
    // Try to decode it
    atob(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper function to safely convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}
