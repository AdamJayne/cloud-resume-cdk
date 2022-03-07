import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as CloudResumeCdk from '../lib/cloud-resume-cdk-stack';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/cloud-resume-cdk-stack.ts
test('S3 Bucket Created', () => {
  const app = new cdk.App();
//     // WHEN
  const stack = new CloudResumeCdk.CloudResumeCdkStack(app, 'MyTestStack');
//     // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::S3::Bucket', {
    WebsiteConfiguration: {
      IndexDocument: 'index.html',
      ErrorDocument: 'index.html'
    }
  });
});
