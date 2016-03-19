'use strict';
var CoreObject = require('core-object');
var fs = require('fs');
var path = require('path');
var AWS = require('aws-sdk');
var archiver = require('archiver');
var Promise = require('ember-cli/lib/ext/promise');
var _ = require('lodash');
var mime = require('mime');
var EXPIRE_IN_2030 = new Date('2030');
var TWO_YEAR_CACHE_PERIOD_IN_SEC = 60 * 60 * 24 * 365 * 2;
var mkdirp = require('mkdirp');

module.exports = CoreObject.extend({
    init: function(options, parentPlugin) {

        this.awsS3Client = new AWS.S3(options.awsS3ServiceOptions);
        this.manifestPath = '';
        this.parent = parentPlugin;
        this.archiveType = options.archiveType;
        this.archiveTempDirectory = options.archiveTempDirectory;
        this.revisionKey = options.revisionKey;
        this.distDir = options.distDir;
        this.s3PutObjectOptions = undefined;
        





    },
    upload: function(distFiles, s3PutObjectOptions, manifestPath) {


        var originalUploadKey = s3PutObjectOptions.Key;
        var archiveFilePath = '';
        this.manifestPath = manifestPath;
        this.s3PutObjectOptions = s3PutObjectOptions;





        return this.getFilesForUpload(distFiles)
            .then(this.createArchiveForFiles.bind(this))
            .then((result) => {
                var key = '';
                archiveFilePath = result;
                if ((!originalUploadKey) || (originalUploadKey.trim() === ''))
                    key = this.manifestPath
                else key = path.join(originalUploadKey, this.manifestPath);
                return this.uploadFile(path.join(this.distDir, this.manifestPath), s3PutObjectOptions, key)
            })
            .then((result) => {
                
                var key='';
                if ((!originalUploadKey) || (originalUploadKey.trim() === ''))
                    key = path.basename(archiveFilePath);
                else key = path.join(originalUploadKey, path.basename(archiveFilePath));

                


                return this.uploadFile(archiveFilePath, s3PutObjectOptions, key)

            });
    },
    getFilesForUpload: function(distFiles) {

        var parent = this.parent;
        var filePaths = distFiles || [];
        if (typeof filePaths === 'string') {
            filePaths = [filePaths];
        }


        var folderKey = this.s3FolderKey;
        var manifestPath = this.manifestPath;
        if (manifestPath) {
            var key = folderKey === '' ? manifestPath : [folderKey, manifestPath].join('/');
            parent.log('Downloading manifest for differential deploy from `' + key + '`...');
            return new Promise(function(resolve, reject) {
                var params = {
                    Bucket: this.s3PutObjectOptions.Bucket,
                    Key: key
                };
                this.awsS3Client.getObject(params, function(error, data) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(data.Body.toString().split('\n'));
                    }
                }.bind(this));
            }.bind(this)).then(function(manifestEntries) {
                parent.log("Manifest found. Differential deploy will be applied.", {
                    verbose: true
                });
                return this.difference(filePaths, manifestEntries);
            }).catch(function( error ) {
                parent.log("Manifest not found. Disabling differential deploy. Reason: " + error, {
                    color: 'yellow',
                    verbose: true
                });
                return Promise.resolve(filePaths);
            });
        } else {
            return Promise.resolve(filePaths);
        }
    },
    createArchiveForFiles: function(filePaths) {
        var parent = this.parent;
        var archive = archiver.create(this.archiveType);
        //check and create archive directory
        mkdirp.sync(this.archiveTempDirectory);
        var archiveFilePath = path.join(this.archiveTempDirectory, this.revisionKey + '.' + this.archiveType);
        var outputFile = fs.createWriteStream(archiveFilePath);
        return new Promise(function(resolve, reject) {
            outputFile.on('close', function() {
                resolve(archiveFilePath);
            });
            outputFile.on('error', function(error) {
                reject(error);
            });
            archive.pipe(outputFile);
            for (var filePath of filePaths) {
                archive.append(fs.createReadStream(path.join(this.distDir, filePath)), {
                    name: filePath
                })
            }
            archive.finalize();
        }.bind(this));
    },
    uploadFile: function(filePath, s3PutObjectOptions, uploadKey) {
        var parent = this.parent;
        var fileData = fs.readFileSync(filePath);
        var contentType = mime.lookup(filePath);
        var encoding = mime.charsets.lookup(contentType);
        var cacheControl = 'max-age=' + TWO_YEAR_CACHE_PERIOD_IN_SEC + ', public';
        var expires = EXPIRE_IN_2030;
        if (encoding) {
            contentType += '; charset=';
            contentType += encoding.toLowerCase();
        }

        s3PutObjectOptions.Body = fileData;
        if (!s3PutObjectOptions.CacheControl)
            s3PutObjectOptions.CacheControl = cacheControl;
        if (!s3PutObjectOptions.Expires)
            s3PutObjectOptions.Expires = expires;
        if (!s3PutObjectOptions.ContentType)
            s3PutObjectOptions.ContentType = contentType;

        s3PutObjectOptions.Key = uploadKey;
        return new Promise(function(resolve, reject) {
            //Need to upload manifest file as well.

            this.awsS3Client.putObject(s3PutObjectOptions, function(error, data) {
                if (error) {
                    parent.log(error);
                    reject(error);
                } else {
                    parent.log(data);
                    resolve({
                        bucket: s3PutObjectOptions.Bucket,
                        archiveType: this.archiveType,
                        eTag: data.ETag,
                        key: s3PutObjectOptions.Key,
                        versionId: data.VersionId || undefined
                    });
                }
            }.bind(this));
        }.bind(this))



    },


});
