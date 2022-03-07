import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as targets from 'aws-cdk-lib/aws-route53-targets'

export class CloudResumeCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    let resumeBucket = new s3.Bucket(this, 'ResumeBucket', {
      publicReadAccess: true,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', 
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    new s3deploy.BucketDeployment(this, 'ResumeClientBucketDeployment', {
      sources: [s3deploy.Source.asset('./lib/client')],
      destinationBucket: resumeBucket
    });

    const hostedZone = route53.HostedZone.fromLookup(this, "DomainZone", { domainName: 'adamljayne.com' });

    const resumeCertificate = new acm.DnsValidatedCertificate(this, 'ResumeCertificate', {
      domainName: 'test.adamljayne.com',
      hostedZone: hostedZone,
      cleanupRoute53Records: true
    });

    const resumeDistrobution = new cloudfront.Distribution(this, 'ResumeDistrobution', {
      defaultBehavior: {
        origin: new origins.S3Origin(resumeBucket),
      },
      domainNames: ['test.adamljayne.com'],
      certificate: resumeCertificate
    });

    new route53.AaaaRecord(this, "ResumeCloudfrontRecord", {
      zone: hostedZone,
      recordName: 'test.adamljayne.com',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(resumeDistrobution)),
    });

  }
}
