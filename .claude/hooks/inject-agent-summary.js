let data = '';
process.stdin.on('data', c => data += c);
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(data);
  } catch (e) {
    process.exit(0);
  }
  const toolInput = input.tool_input || {};
  const note = "\n\n---\n작업 완료 후, 무엇을 했는지와 주요 변경/발견 사항을 요약해서 저장소 루트의 agent-summaries/ 폴더 아래 마크다운 파일로 작성해줘. 파일명 형식: agent-summaries/YYYY-MM-DD-간단한-설명.md";
  if (typeof toolInput.prompt === 'string' && !toolInput.prompt.includes('agent-summaries/')) {
    const updatedInput = Object.assign({}, toolInput, { prompt: toolInput.prompt + note });
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'allow',
        updatedInput
      }
    }));
  }
});
