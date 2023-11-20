import { createWorker } from '../queue';
import { AIQueue, GetQueueJobDataType } from '../@types/queues.types';
import OpenAI from 'openai';
import { env } from '../env';
import axios from 'axios';

export const createAIWorker = (queueName = 'ai') =>
  createWorker<AIQueue['Job'], any, AIQueue['JobNames']>(
    queueName,
    async (job) => {
      const logger = job.log.bind(job);

      try {
        if (job.data.type === 'generate-story-og-summary') {
          await handleGenerateOgSummary(job.data.data);
        }
      } catch (error) {
        console.log(error);
        logger(String(error));
        throw error;
      }
    }
  );

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

async function handleGenerateOgSummary(
  data: GetQueueJobDataType<AIQueue, 'generate-story-og-summary'>['data']
) {
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `The user will give you an article, & your job is to write a short description to it and to ALWAYS follow these rules:
        - The description should be short (just a few lines)
        - The description should be written in a way that will make people excited to read the full article. 
        - The description should be written as if the author of the article wrote it himself, not another person.
        - The output MUST always be a JSON object with one key: 'summary', where the value is the summary you generated.
  `,
      },
      {
        role: 'user',
        content: `
  Summarize this article which is surrounded by triple backticks:
  \`\`\`
  ${data.story.title}
  --------------------
  ${data.story.body}
  \`\`\`
  `,
      },
    ],
    model: 'gpt-3.5-turbo',
  });

  if (completion.choices[0].finish_reason !== 'stop') return null;

  const content = completion.choices[0].message.content;

  const json = JSON.parse(content ?? '{}');

  const summary = json.summary;

  if (!summary) throw new Error('Summary not found in response');

  makeCallbackRequest(data.callback_url, {
    type: 'generate-story-og-summary',
    story_id: data.story.id,
    summary,
  });
}

async function makeCallbackRequest(
  url: string,
  data: string | Record<any, any>
) {
  return axios.post(url, data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(
        `${env.BF_SERVERLESS_SERVICE_USERNAME}:${env.BF_SERVERLESS_SERVICE_PASS}`
      ).toString('base64')}`,
    },
  });
}
