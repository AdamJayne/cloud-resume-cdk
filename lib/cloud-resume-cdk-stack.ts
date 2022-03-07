import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';


// import * as sqs from 'aws-cdk-lib/aws-sqs';

declare const hostedZone: route53.HostedZone;

export class CloudResumeCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const resumeCertificate = new acm.DnsValidatedCertificate(this, 'resume-site-cert', {
    //   domainName: 'www.adamljayne.com',
    //   hostedZone,
    //   subjectAlternativeNames: [
    //     'test.adamljayne.com',
    //   ]
    // });

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

    new CfnOutput(this, 'WebsiteUrl', {
      value: resumeBucket.bucketWebsiteUrl
    });

    // new cloudfront.Distribution(this, 'ResumeDistrobution', {
    //   defaultBehavior: {
    //     origin: new origins.S3Origin(resumeBucket),
    //   },
    //   certificate: resumeCertificate
    // });

    // new route53.ARecord(this, 'resumeS3Domain', {
    //   zone: hostedZone,
    //   target: route53.RecordTarget.fromAlias(resumeBucket.urlForObject)
    // });


    
  }
}
