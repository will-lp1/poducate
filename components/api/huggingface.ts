import axios from 'axios';
import * as AWS from 'aws-sdk';
import SageMaker from 'aws-sdk/clients/sagemaker';

const HUGGING_FACE_API_KEY = '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';

export async function generateText(prompt: string): Promise<string> {
  const response = await axios.post(
    'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-405B',
    { inputs: prompt },
    {
      headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` },
    }
  );
  return response.data[0].generated_text;
}

export async function generateSpeech(topic: string, subject: string, style: string, difficulty: number): Promise<string> {
  const prompt = `Generate a podcast script around 800 characters in length about ${topic} focusing on ${subject}. Additional details: ${style}, ${difficulty}.`;
  const generatedText = await generateText(prompt);

  let role;
  try {
    const iam = new AWS.IAM();
    role = await iam.getRole({ RoleName: 'sagemaker_execution_role' }).promise().then((data) => data.Role.Arn);
  } catch (error) {
    throw new Error('Unable to get execution role');
  }

  const hub = {
    HF_MODEL_ID: 'parler-tts/parler_tts_mini_v0.1',
    HF_TASK: 'text-to-speech',
  };

  const sagemakerClient = new SageMaker();

  const createModelParams = {
    ModelName: 'huggingface-model',
    PrimaryContainer: {
      Image: '763104351884.dkr.ecr.us-west-2.amazonaws.com/huggingface-pytorch-inference:1.6.0-transformers4.6.1-gpu-py36-ubuntu18.04',
      Environment: hub,
      ModelDataUrl: 's3://path-to-your-model/model.tar.gz',
    },
    ExecutionRoleArn: role,
  };

  await sagemakerClient.createModel(createModelParams).promise();

  const createEndpointConfigParams = {
    EndpointConfigName: 'huggingface-endpoint-config',
    ProductionVariants: [
      {
        VariantName: 'AllTraffic',
        ModelName: 'huggingface-model',
        InitialInstanceCount: 1,
        InstanceType: 'ml.m5.xlarge',
      },
    ],
  };

  await sagemakerClient.createEndpointConfig(createEndpointConfigParams).promise();

  const createEndpointParams = {
    EndpointName: 'huggingface-endpoint',
    EndpointConfigName: 'huggingface-endpoint-config',
  };

  await sagemakerClient.createEndpoint(createEndpointParams).promise();

  const runtime = new AWS.SageMakerRuntime();

  const response = await runtime.invokeEndpoint({
    EndpointName: 'huggingface-endpoint',
    Body: JSON.stringify({ inputs: generatedText }),
    ContentType: 'application/json',
    Accept: 'application/json',
  }).promise();

  const audioBuffer = Buffer.from(response.Body as string, 'base64');
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}
