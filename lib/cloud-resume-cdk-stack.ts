import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as dynamoDB from "aws-cdk-lib/aws-dynamodb";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as path from "path";

import { StaticWebApplication } from "./constructs/client-bucket";

export class CloudResumeCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Front-end and back-end domains to use for the application
    const baseDomain = "adamljayne.com";
    const websiteDomain = `resume.${baseDomain}`;
    const apiDomain = `resumeapi.${baseDomain}`;

    // Pulling the hosted zone for the application's domain
    const hostedZone = route53.HostedZone.fromLookup(this, "DomainZone", {
      domainName: baseDomain,
    });

    // Generating an SSL certificate for all subdomains in the domain chosen, using automatic Route53 DNS validation
    const certificate = new acm.DnsValidatedCertificate(
      this,
      `-WebApplicationCertificate`,
      {
        domainName: `*.${baseDomain}`,
        cleanupRoute53Records: true,
        hostedZone,
      }
    );

    // This was done to test my understanding of how the Construct class works
    // The StaticWebApplication class represents the creation and deployment of a static web app
    new StaticWebApplication(this, "Resume", {
      domainName: websiteDomain,
      webAppDirectory: path.join(__dirname, "/client"),
      indexDocument: "resume.html",
      errorDocument: "resume.html",
      hostedZone,
      acmCertificate: certificate,
    });

    // Create the table in DynamoDB the application will use
    const resumeDatabase = new dynamoDB.Table(this, "ResumeTable", {
      tableName: "test-table",
      partitionKey: { name: "id", type: dynamoDB.AttributeType.STRING },
      billingMode: dynamoDB.BillingMode.PAY_PER_REQUEST,
    });

    // Create a lambda function using the code inside of the /lambda directory.
    const resumeViewsFunction = new Function(this, "ResumeViewCountFunction", {
      runtime: Runtime.NODEJS_14_X,
      handler: "page-views.handler",
      code: Code.fromAsset(path.join(__dirname, "lambda")),
    });

    // Granting the Lambda function READ/WRITE to the DynamoDB Instance
    resumeDatabase.grantReadWriteData(resumeViewsFunction);

    // Creating an api gateway for the backend
    const resumeApiGateway = new apiGateway.RestApi(this, "ResumeApiGateway", {
      restApiName: "Resume Api Test",
      description: "Testing purposes",
      domainName: {
        domainName: apiDomain,
        certificate,
      },
    });

    // Generating a gateway integration with the lambda function
    const resumeViewsLambdaGatewayIntegration =
      new apiGateway.LambdaIntegration(resumeViewsFunction);

    // Attaching that gateway integration to the base route in the gateway
    resumeApiGateway.root.addMethod("GET", resumeViewsLambdaGatewayIntegration);

    // Creating an A record for the api gateway domain for a custom domain
    new route53.ARecord(this, "ResumeApiGatewayCustomDomainRecord", {
      zone: hostedZone,
      recordName: apiDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGateway(resumeApiGateway)
      ),
    });

    // Create a code pipeline for CI/CD when the main branch is updated on GitHub
    new pipelines.CodePipeline(this, "ResumeApplicationCodePipeline", {
      pipelineName: "ResumeAppPipeline",
      synth: new pipelines.ShellStep("CDK Synth", {
        input: pipelines.CodePipelineSource.gitHub(
          "AdamJayne/cloud-resume-cdk",
          "main"
        ),
        commands: ["npm ci", "npm run build", "npm run cdk synth"],
      }),
    });
  }
}
