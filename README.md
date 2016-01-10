# Ember-cli-deploy-aws-codedeploy

> AWS CodeDeploy is a service that automates code deployments to any AWS instance, including Amazon EC2 instances and instances running on-premises. This ember-cli-deploy plugin for CodeDeploy makes it easier for you to rapidly release new features by automatically uploading and creating deployments on AWS Code Deploy. The plugin can bundle your files in an archive (tar & zip), upload to S3 and create/trigger a deployment on AWS Code Deploy. For details on the AWS Code Deploy service, refer to [AWS documentation](https://aws.amazon.com/codedeploy/). 


## What is an ember-cli-deploy-plugin

A plugin is an ember-cli addon that works with the ember-cli-deploy pipeline in order to add functionality to a deploy or related operation.
For more information on what plugins are and how they work, please refer to the [Plugin Documentation](http://ember-cli.com/ember-cli-deploy/plugins/).

## Quick Start

To get up and running quickly, do the following:

* Ensure ember-cli-deploy-build is installed and configured.
* Install this plugin

```bash
$ ember install ember-cli-deploy-aws-codedeploy
```
* Create an AppSpec.yml file as required by AWS Code Deploy and place it in the `public` directory of the root folder of your ember project.
* Update your `config/deploy.js` with details relavant to your environment as below. All these options are mandatory:

```
ENV['aws-codedeploy'] = {
    archiveType: 'zip',
    accessKeyId: 'AWS Access Key ID',
    secretAccessKey: 'Secret Key associated with your accessKey',
    region: 'Region for your bucket and EC2',
    s3UploadOptions: {
		Bucket: 'name of the s3 bucket you are deploying to',
    },
    awsDeploymentOptions: {
		
		applicationName: 'your cool webapp', //required. The name of your application as configured in Code Deploy
		deploymentGroupName: 'deployment group',   //Name of the deployment group as configured in Code Deploy
        revision: {
        	//required 'S3' || GitHub'. S3 by default. To configure GitHub depoyment, refer to documentation below.
        	revisionType: 'S3', 
        			
        }
	}
}
```
* Run the pipeline:

```bash 
ember deploy
```

## Introduction
This plugin for AWS Code deploy enables developers to quickly package and deploy their Ember.js application to an Amazon EC2 instance. When invoked as part of the build pipeline, the plugin can create zip or tar archive of your deployment and then upload it to S3 bucket. It will then automatically use the details of the uploaded archive on S3 to trigger a deployment on EC2 using AWS Code deploy. The plugin offers several features including:

* Customize what files are packaged using `filePattern`
* Only deploy updated/modified using `manifestPath` (requires [ember-cli-deploy-manifest](https://github.com/lukemelia/ember-cli-deploy-manifest) ) 
* Trigger a deployment from archive file uploaded on S3 or from GitHub commit/revision using `revisionType`
* Automatically name your files based on GitHub commit and revision. 



## Installation

Run the following command in your terminal:

```bash
ember install ember-cli-deploy-aws-codedeploy
```


## ember-cli-deploy Hooks Implemented

* `prepare`
* `upload`

## Configuration Options

The plugin configuration options are categorized in two different categories. The first set is the options that control the behaviour of the plugin itself and the second set of options that control the behaviour when interacting with AWS services. Below is a configuration object will all possible configuration options.

```javascript
ENV['aws-codedeploy'] = {

	/* Plugin specific options. See documentation below for details. */

    archiveType: 'zip',
    filePattern: '**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,yml,html,htm}',
    basePackageName: this.project.pkg.name + '-' + this.project.pkg.version,
	archiveType: 'zip',
    archiveTempDirectory: 'tmp',
    distDir: 'STRING', 
    distFiles: [],
    manifestPath: 'STRING',
    revisionKey: 'STRING',

	/* AWS Specific Options 																											*/
	/* These options apply across all AWS operations 																					*/
	/* By default, these options will apply to both S3 and Code Deploy client. If you want to override settings 					    */
	/* for either S3 or CodeDeploy clients, use the 'Advanced Configuration' options. 													*/
	
	accessKeyId: 'Your access key for AWS',
	secretAccessKey: 'Your secret access key for accessKeyId above',
    region: 'Region associated with your EC2 instance, S3 Bucket and Code Deploy',

    /* For more fine grained control for upload(PutObject) and deployment (CreateDeployment), customize									*/
    /* each of these below. The only option required is Bucket. 																		*/
    /* To understand what each option does, refer to:																					*/
    /* http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property) 												*/

	/* S3 Upload operation options (S3 PutObject) 																						*/
    s3UploadOptions: {
    	/* Bucket is the only required option. Determines the S3 Bucket archive will be uploaded to. 									*/
    	Bucket: 'STRING',																												
		Key: 'STRING_VALUE', /* If not specified, this is defaulted to 'pkg.name-pkg.version-githubrevision-timestamp'  				
  		ACL: 'private | public-read | public-read-write | authenticated-read | aws-exec-read | bucket-owner-read | bucket-owner-full-	control', /* Defaults to 'public-read' 																						  	*/

  		Body: new Buffer('...') || 'STRING_VALUE' || streamObject, //This is auto populated by the plugin.
  		CacheControl: 'STRING_VALUE',
  		ContentDisposition: 'STRING_VALUE',
  		ContentEncoding: 'STRING_VALUE',
  		ContentLanguage: 'STRING_VALUE',
  		ContentLength: 0,
  		ContentMD5: 'STRING_VALUE',
  		ContentType: 'STRING_VALUE',
  		Expires: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
  		GrantFullControl: 'STRING_VALUE',
  		GrantRead: 'STRING_VALUE',
  		GrantReadACP: 'STRING_VALUE',
  		GrantWriteACP: 'STRING_VALUE',
  		Metadata: {
    		someKey: 'STRING_VALUE',
    		/* anotherKey: ... */
  		},
  		RequestPayer: 'requester',
  		SSECustomerAlgorithm: 'STRING_VALUE',
  		SSECustomerKey: new Buffer('...') || 'STRING_VALUE',
  		SSECustomerKeyMD5: 'STRING_VALUE',
  		SSEKMSKeyId: 'STRING_VALUE',
  		ServerSideEncryption: 'AES256 | aws:kms',
  		StorageClass: 'STANDARD | REDUCED_REDUNDANCY | STANDARD_IA',
  		WebsiteRedirectLocation: 'STRING_VALUE'
	},
	/* This option can be used to customize the behaviour of deployment created by this plugin */
	/* The only required options are applicationName, deploymentGroupName and revision.revisionType */
	/* To understand what each of the option does, refer to [AWS createDeployment Documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CodeDeploy.html#createDeployment-property) */

    /* Deployment Options (S3 createDeployment)																						*/
    awsDeploymentOptions: {
    	applicationName: 'application ame', //required. Defaults to pkg.name as specified in package.json.
        deploymentGroupName: 'deployment group name',   //required
		deploymentConfigName: 'STRING_VALUE',
		description: 'STRING_VALUE',
  		ignoreApplicationStopFailures: true || false,
  		revision: {
  			revisionType: 'S3' //required 'S3' || GitHub'. Defaults to 'S3'
  			gitHubLocation: {
      			commitId: 'STRING_VALUE',
      			repository: 'STRING_VALUE'
    		},
    		s3Location: {
      			bucket: 'STRING_VALUE',
      			bundleType: 'tar | zip', //Only zip and tar are supported by this plugin.
      			eTag: 'STRING_VALUE',
      			key: 'STRING_VALUE',
      			version: 'STRING_VALUE'
    		}
    	}
    }
	
	/* Advanced AWS Configuration Options */
    awsS3ServiceOptions: {
    	/* This option is passed as such to the constructor for AWS S3 Client. */
    	/* Refer to http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property for detailed explanation. */


	},
	awsCodeDeployServiceOptions: {
		/* This option is passed as such to the constructor for AWS Code Deploy Client. */
    	/* Refer to http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CodeDeploy.html#constructor-property for detailed      */
    	/* explanation. */

	},

}

```


### Plugin Configuration Explained:

The behaviour of the plugin can be customized using the options documented below. It may also be useful to spend sometime understanding how [ember-cli-deploy plugins work](http://ember-cli.com/ember-cli-deploy/plugins/) and how to configure plugins.


#### filePattern: 
If deploying via S3, this option determines what files from local deployment directory (dist) will be included in the archive that is uploaded to S3.
Default pattern: `**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2,yml,html,htm}` 

#### basePackageName: 
By default, the plugin will create an archive called 'pgk.name-pkg.version-githubRevisionKey-currentTimeStamp'. The plugin reads `pkg.name` and `pkg.version` from `package.json` in your project and reads GitHub revision key using [ember-cli-deploy-revision-data](https://github.com/ember-cli-deploy/ember-cli-deploy-revision-data) plugin.

#### archiveType: 
The format of the archive file that will be created and uploaded to S3 bucket. Supported options are 'zip' and 'tar'.
Default: 'zip'

#### archiveTempDirectory: 
The temporary directory where the archive will be created. Default value is 'aws-deploy' in project root. 

#### distDir: 
The root directory where the files matching filePattern will be searched for. By default, this option will use the distDir property of the deployment context, provided by [ember-cli-deploy-build](https://github.com/ember-cli-deploy/ember-cli-deploy-build).

Default: `context.distDir`

#### distFiles: 
The list of built project files. This option should be relative to distDir and should include the files that match filePattern. By default, this option will use the distFiles property of the deployment context, provided by [ember-cli-deploy-build](https://github.com/ember-cli-deploy/ember-cli-deploy-build).

Default: `context.distFiles`

#### manifestPath: 
The path to a manifest that specifies the list of files that are to be uploaded to S3. This manifest file will be used to work out which files don't exist on S3 and, therefore, which files should be uploaded. By default, this option will use the manifestPath property of the deployment context, provided by [ember-cli-deploy-manifest](https://github.com/lukemelia/ember-cli-deploy-manifest).

Default: `context.manifestPath`

#### revisionKey: 
The revision key of this deployment. By defailt, the revision key is appended to the name and version of the package archive to uniquely identify each package. By default, the plugin will try to use revision data provided by [ember-cli-deploy-revision-data](https://github.com/ember-cli-deploy/ember-cli-deploy-revision-data)

Default: `context.revisionData + context.revisionData.timestamp`



### AWS Configuration Options:

 The plugin uses the [Amazon Node.js SDK](https://aws.amazon.com/sdk-for-node-js/) libraries to connect and interact with AWS services. Most configuration options for this plugin are pass through options for AWS S3 client. For a detailed description of each option, please refer to the following documentation:

1. [AWS S3 Service Construction Options](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property)
2. [AWS S3 PutObject Options](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property)
3. [AWS S3 Code Deploy Service Construction Options](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CodeDeploy.html#constructor-property)
4. [AWS S3 Code Deploy Create Deployment Options](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CodeDeploy.html#createDeployment-property)

The following three options simply configuration if just want to use the default behaviour. By default, the plugin will use the values configured here for both S3 and Code deploy client. If you want to override settings for S3 and Code Deploy client individually, use the advanced configuration options. 
#### accessKeyId
The accessKeyId you want to use to connect to both S3 and Code Deploy services. The user must have appropriate permissions on respective services. By default this will be the user/accessKeyId used to connect to *both* S3 and Code Deploy services.

#### secretAccessKey: 
Your secret access key for accessKeyId above.

#### region: 
Region associated with your EC2 instance, S3 Bucket and Code Deploy. By default, the same region will be used for S3 and Code Deploy. If you want to override settings for S3 and Code Deploy client individually, use advanced configuration below. Please note that if you are using different regions, the setup must be supported on AWS.



#### s3UploadOptions
The options customize the behavior of the `PutObject` call used to upload the archive on S3. If you are deploying via S3, the only mandatory option is the name of the bucket. The other options are automatically filled in by the plugin. You can, of course, change the options to customize the behaviour. For a detailed explanation of all options, refer to [AWS SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property). Following is a list of supported options:

* Bucket: 'STRING_VALUE', /* required */
* Key: 'STRING_VALUE', 
* ACL: 'private | public-read | public-read-write | authenticated-read | aws-exec-read | bucket-owner-read | bucket-owner-full-control',
* Body: new Buffer('...') || 'STRING_VALUE' || streamObject,
* CacheControl: 'STRING_VALUE',
* ContentDisposition: 'STRING_VALUE',
* ContentEncoding: 'STRING_VALUE',
* ContentLanguage: 'STRING_VALUE',
* ContentLength: 0,
* ContentMD5: 'STRING_VALUE',
* ContentType: 'STRING_VALUE',
* Expires: new Date || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789,
* GrantFullControl: 'STRING_VALUE',
* GrantRead: 'STRING_VALUE',
* GrantReadACP: 'STRING_VALUE',
* GrantWriteACP: 'STRING_VALUE',
* Metadata:
```javascript
 {someKey: 'STRING_VALUE',
    		/* anotherKey: ... */
  },
```
* RequestPayer: 'requester',
* SSECustomerAlgorithm: 'STRING_VALUE',
* SSECustomerKey: new Buffer('...') || 'STRING_VALUE',
* SSECustomerKeyMD5: 'STRING_VALUE',
* SSEKMSKeyId: 'STRING_VALUE',
* ServerSideEncryption: 'AES256 | aws:kms',
* StorageClass: 'STANDARD | REDUCED_REDUNDANCY | STANDARD_IA',
* WebsiteRedirectLocation: 'STRING_VALUE'



#### awsDeploymentOptions
A container object for all AWS Code Deploy related options. These options control the deployment that is created and triggered on AWS Code Deploy. These options are passed on to the `createDeployment` method of the AWS Code Deploy client library. Full a detailed explanation of each of these options, refers to the [Code Deploy SDK documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CodeDeploy.html#createDeployment-property). The only option that are required are deploymentGroupName and revision.revisionType. Please note that application name defaults to the name of the application as configured in package.json of your project. Supported options are:


* applicationName: 'STRING_VALUE'
  	Defaults to pkg.name as specified in package.json

* deploymentConfigName: 'STRING_VALUE'
  	Name of the deployment configuration as configured in your AWS Code Deploy configuration.

* deploymentGroupName: 'STRING_VALUE' (Required)
	Name of the deployment group as configured in your Code Deploy configuration 
* description: 'STRING_VALUE'
	Description for this deployment.
* ignoreApplicationStopFailures: true || false
	Controls whether or not to ignore any errors when the application is stopped for deployment.
* revision:
	Use this option to speicify whether the application is archived and deployed as an 'S3' archive or is deployed via GitHub repository. The default is to use S3. If you want to deploy via GitHub, set revisionType parameter below to 'GitHub' and specify commitId and repository in the 'gitHubLocation' object.
 {
    revisionType: 'S3 | GitHub',
    gitHubLocation: {
      commitId: 'STRING_VALUE',
      repository: 'STRING_VALUE'
    },
    
    s3Location: {
      bucket: 'STRING_VALUE',
      bundleType: 'tar | zip',
      eTag: 'STRING_VALUE',
      key: 'STRING_VALUE',
      version: 'STRING_VALUE'
    }
  }
	* revisionType: used to specify the location of the deployment - whether to deploy from S3 or from GitHub. Valid values are 'S3' and 'GitHub'. You may need to perform additional configuration in case of GitHub location e.g. security. Refer to this [Deploy a revision with AWS Code Deploy](http://docs.aws.amazon.com/codedeploy/latest/userguide/how-to-deploy-revision.html)
	
	* gitHubLocation: Used to specify the location of GitHub repository if deploying from GitHub(`revision.revisionType==='GitHub'`)
	
		* commitId: The SHA1 commit ID of the GitHub commit that references the that represents the bundled artifacts for the application revision.
	
		* repository: The GitHub account and repository pair that stores a reference to the commit that represents the bundled artifacts for the application revision. Specified as account/repository e.g. MojoJojo/ember-cli-deploy-aws-codedeploy. 
	
	* s3Location: If you are deploying via S3 (`revision.revisionType==='S3'`), this configuration object specifies the details of S3 object that is used deployment. The only required/mandatory option in this object is the name of the S3 bucket(`bucket`). All other options are filled in by the plugin automatically. However, if you do specify these options manually - the custom configuration takes precendence. The following options are supported.
	
		* bucket: The name of the S3 bucket where to look for the deployment archive.
	
		* bundleType: The type of archive that is being deployed. Valid options are zip and tar. tgz is not supported at this point.
	
		* eTag: the ETag of the archive on S3 to deploy.
	
		* key: The key (file/path) name of the archive to use for deployment
	
		* version: the file version to use for deployment.

#### awsS3ServiceOptions
The options control the behaviour of the S3 client that is instantiated to upload objects on S3. These options are passed on to the constructor of the S3 client object (`AWS.S3(options)`). Refer to [AWS S3 SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property) for detailed explanation.


#### awsCodeDeployServiceOptions
These options control the behaviour of the AWS Code Deploy client that is instantiated to create deployment on AWS. The options are passed to the constructor of the Code Deploy client object (`AWS.CodeDeploy(options)`). Refer to [AWS S3 SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property) for detailed explanation


## Prerequisites

The following properties are expected to be present on the deployment context object:

* distDir ([provided by ember-cli-deploy-build](https://github.com/ember-cli-deploy/ember-cli-deploy-build))
* distFiles ([provided by ember-cli-deploy-build](https://github.com/ember-cli-deploy/ember-cli-deploy-build))
* gzippedFiles ([provided by ember-cli-deploy-gzip](https://github.com/lukemelia/ember-cli-deploy-gzip))
* manifestPath ([provided by ember-cli-deploy-manifest](https://github.com/lukemelia/ember-cli-deploy-manifest))


## Configuring Amazon S3 - Minimum Permissions Required

Ensure you have the minimum required permissions configured for the user (accessKeyId). A bare minimum policy should have the following permissions:
```
{
    "Statement": [
        {
            "Sid": "Stmt1EmberCLIS3DeployPolicy",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:PutObjectACL"
            ],
            "Resource": [
                "arn:aws:s3:::<your-s3-bucket-name>/*"
            ]
        }
    ]
}
```

Replace with the name of the actual bucket you are deploying to. Also, remember that "PutObject" permission will effectively overwrite any existing files with the same name unless you use a fingerprinting or a manifest plugin.

