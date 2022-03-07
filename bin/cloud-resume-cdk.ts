#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CloudResumeCdkStack } from '../lib/cloud-resume-cdk-stack';

const app = new cdk.App();
new CloudResumeCdkStack(app, 'CloudResumeCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});