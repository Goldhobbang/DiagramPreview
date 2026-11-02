import { fileURLToPath } from 'node:url';
import { createConfig } from '@pixelhize/goodui-cli/config';

export default await createConfig({
  rootDir: fileURLToPath(new URL('.', import.meta.url)),
  policyPath: "goodui.policy.json",
});
