import { RemovalPolicy } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as targets from "aws-cdk-lib/aws-route53-targets";

export interface StaticWebApplicationProps {
  domainName: string;
  webAppDirectory: string;
  indexDocument: string;
  errorDocument: string;
  hostedZone: route53.IHostedZone;
  acmCertificate: acm.ICertificate;
}

export class StaticWebApplication extends Construct {
  constructor(scope: Construct, id: string, props: StaticWebApplicationProps) {
    super(scope, id);

    const bucket = new s3.Bucket(this, `-WebApplicationBucket`, {
      publicReadAccess: true,
      websiteIndexDocument: props.indexDocument,
      websiteErrorDocument: props.errorDocument,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, `-WebApplicationBucketDeployment`, {
      sources: [s3deploy.Source.asset(props.webAppDirectory)],
      destinationBucket: bucket,
    });

    const distrobution = new cloudfront.Distribution(
      this,
      `-WebApplicationDistrobution`,
      {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
        },
        domainNames: [props.domainName],
        certificate: props.acmCertificate,
      }
    );

    new route53.ARecord(this, `-WebApplicationCloudfrontRecord`, {
      zone: props.hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distrobution)
      ),
    });
  }
}
