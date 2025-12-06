import { GPUBindGroupAddress } from "@/interfaces/GeometryType";

function compare(operator: string, operand: string, value: number | boolean) {
  if (operator === '==') {
    return Number(operand) === value;
  } else if (operator === '!=') {
    return Number(operand) !== value;
  } else if (operator === '>') {
    return Number(operand) > Number(value);
  } else if (operator === '<') {
    return Number(operand) < Number(value);
  } else if (operator === '>=') {
    return Number(operand) >= Number(value);
  } else if (operator === '<=') {
    return Number(operand) <= Number(value);
  }

  return false;
}

function isOperator(char: string) {
  return char === '=' || char === '>' || char === '<' || char === '!';
}

function getCondition(line: string) {
  const list = [];
  let current = '';
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === ' ') {
      list.push(current);
      current = '';
      continue;
    }
    if (isOperator(line[i])) {
      if (isOperator(current[current.length - 1])) {
        current += line[i];
      } else {
        list.push(current);
        current = line[i];
      }
      continue;
    }
    if (isOperator(current[current.length - 1])) {
      list.push(current);
      current = line[i];
      continue;
    }
    current += line[i];
  }
  if (current) {
    list.push(current);
  }

  return list.filter((item) => Boolean(item));
}

/**
 * Preprocessor for GPU shader code, handling directives like #if, #else, #endif, etc.
 * Currently supports simple #if, #else, #elif, #ifdef, #endif directives.
 * @param source - The source code of the shader.
 * @param defines - A map of defined constants and their values.
 * @returns The preprocessed shader code.
 */
export function preprocessor(source: string, defines: Map<string, number | boolean>) {
  const lines = source.split('\n');
  const result: string[] = [];
  const matches: boolean[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const trimLine = lines[i].trim();
    if (/^#ifdef/.test(trimLine)) {
      const defineName = trimLine.split(' ')[1];
      const isMatch = defines.has(defineName);
      matches.push(isMatch);
      continue;
    }
    if (/^#if/.test(trimLine)) {
      const splits = getCondition(trimLine);

      const defineName = splits[1];
      let isMatch = false;
      if (!defines.has(defineName)) {
        isMatch = false;
      } else {
        const operator = splits[2];
        const operand = splits[3];
        if (operator) {
          isMatch = compare(operator, operand, defines.get(defineName)!);
        } else {
          isMatch = Boolean(defines.get(defineName));
        }
      }
      matches.push(isMatch);
      continue;
    }
    if (/^#else/.test(trimLine)) {
      matches[matches.length - 1] = !matches[matches.length - 1];
      continue;
    }
    if (/^#elif/.test(trimLine)) {
      let isMatch = false;
      if (isMatch) {
        isMatch = false;
      } else {
        const splits = getCondition(trimLine);
        const defineName = splits[1];
        if (!defines.has(defineName)) {
          isMatch = false;
        } else {
          const operator = splits[2];
          const operand = splits[3];
          isMatch = compare(operator, operand, defines.get(defineName)!);
        }
      }
      matches[matches.length - 1] = isMatch;
      continue;
    }
    if (/^#endif/.test(trimLine)) {
      matches.pop();
      continue;
    }
    if (matches.length > 0) {
      if (matches.every(Boolean)) {
        result.push(lines[i]);
      }
    } else {
      result.push(lines[i]);
    }
  }

  return result.join('\n');
}

export function buildAttributes(code: string): [string, number][] {
  const matches = code.match(/@location\(\d+\)\s*.+:/g);
  if (!matches) {
    return [];
  }
  const result: [string, number][] = [];
  for (let i = 0; i < matches.length; i += 1) {
    const item = matches[i].match(/@location\((\d+)\)\s*(.+):/);
    if (item) {
      result.push([item[2], Number(item[1])]);
    }
  }
  return result;
}

export function buildUniforms(code: string) {
  const matches = code.match(/@group\(\d+\)\s*@binding\(\d+\)\s*.+;/g);
  if (!matches) {
    return { uniforms: [], textures: [], samplers: [] };
  }
  const uniforms: [string, GPUBindGroupAddress][] = [];
  const samplers: [string, GPUBindGroupAddress][] = [];
  const textures: [string, GPUBindGroupAddress][] = [];
  for (let i = 0; i < matches.length; i += 1) {
    let item = matches[i].match(/@group\((\d+)\)\s*@binding\((\d+)\)\s*var\s*<uniform>\s*(.+):/);
    if (item) {
      uniforms.push([item[3], {
        group: Number(item[1]),
        binding: Number(item[2])
      }]);
      continue;
    }
    item = matches[i].match(/@group\((\d+)\)\s*@binding\((\d+)\)\s*var\s*(.+):\s*texture_2d/);
    if (item) {
      textures.push([item[3], {
        group: Number(item[1]),
        binding: Number(item[2])
      }]);
      continue;
    }
    item = matches[i].match(/@group\((\d+)\)\s*@binding\((\d+)\)\s*var\s*(.+):\s*sampler/);
    if (item) {
      samplers.push([item[3], {
        group: Number(item[1]),
        binding: Number(item[2])
      }]);
      continue;
    }
  }
  return { uniforms, textures, samplers };
}

export function getGPUVertexFormat(itemSize: number): GPUVertexFormat {
  if (itemSize === 1) {
    return 'float32';
  }
  if (itemSize === 2) {
    return 'float32x2';
  }
  if (itemSize === 3) {
    return 'float32x3';
  }
  return 'float32x4';
}
