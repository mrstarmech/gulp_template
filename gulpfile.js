const deploy_folder = "dist";
const src_folder = "src";
const favicon_master = "src/favicon_master.png";
const FAVICON_DATA_FILE = "src/faviconData.json";
const image_quality = 100; //for webp/jpg

let path = {
    build: {
        html: deploy_folder + "/",
        css: deploy_folder + "/css/",
        js: deploy_folder + "/js/",
        img: deploy_folder + "/img/",
        fonts: deploy_folder + "/fonts/",
        ico: deploy_folder + "/",
    },
    src: {
        html: src_folder + "/*.html",
        css: src_folder + "/scss/meta_style.scss",
        js: src_folder + "/js/meta_script.js",
        img: src_folder + "/img/**/*.{jpg,png,svg,webp,gif,ico}",
        ico: src_folder + "/ico/*.*",
        fonts: src_folder + "/fonts/*"
    },
    watch: {
        html: src_folder + "/**/*.{html,htm}",
        css: src_folder + "/scss/**/*.scss",
        js: src_folder + "/js/**/*.js",
        img: src_folder + "/img/**/*.{jpg,png,svg,webp,gif,ico}",
        fonts: src_folder + "/fonts/*.ttf"
    },
    clean: "./" + deploy_folder + "/"
}

let {src,dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    fileinclude = require('gulp-file-include'),
    del = require('del'),
    scss = require('gulp-sass')(require('sass')),
    autoprefixer = require('gulp-autoprefixer'),
    mediagroup = require('gulp-group-css-media-queries'),
    cleancss = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webphtml = require('gulp-webp-html'),
    webpcss = require('gulp-webp-css'),
    ttf2woff = require('gulp-ttf2woff'),
    realfavicon = require('gulp-real-favicon'),
    fs = require('fs'),
    ttf2woff2 = require('gulp-ttf2woff2');

function browserSync() {
    browsersync.init({
        server: {
            baseDir: "./" + deploy_folder + "/"
        },
        port: 3000,
        notify: false
    });
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(realfavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
        .pipe(dest(path.build.html))
        .pipe(rename({
            extname:'.php'
        }))
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream());
}

function css() {
    return src(path.src.css)
        .pipe(scss({
            outputStyle: "expanded"
        }))
        .pipe(mediagroup())
        .pipe(autoprefixer({
            overrideBrowsersList: ["last 5 versions"],
            cascade: true
        }))
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(cleancss())
        .pipe(rename({
            extname: ".min.css"
        }))
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream());
}

function images() {
    return src(path.src.img)
        .pipe(webp({
            quality: image_quality
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: image_quality, progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: true}
                ]
            })
        ]))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream());
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));

    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
}

function generatefav_impl(cb) {
    realfavicon.generateFavicon({
        masterPicture: favicon_master,
        dest: path.build.ico,
        iconsPath: './',
        design: {
            ios: {
                pictureAspect: 'noChange',
                assets: {
                    ios6AndPriorIcons: false,
                    ios7AndLaterIcons: false,
                    precomposedIcons: false,
                    declareOnlyDefaultIcon: true
                }
            },
            desktopBrowser: {
                design: 'raw'
            },
            windows: {
                pictureAspect: 'noChange',
                backgroundColor: '#da532c',
                onConflict: 'override',
                assets: {
                    windows80Ie10Tile: false,
                    windows10Ie11EdgeTiles: {
                        small: false,
                        medium: true,
                        big: false,
                        rectangle: false
                    }
                }
            },
            androidChrome: {
                pictureAspect: 'noChange',
                themeColor: '#ffffff',
                manifest: {
                    display: 'standalone',
                    orientation: 'notSet',
                    onConflict: 'override',
                    declared: true
                },
                assets: {
                    legacyIcon: false,
                    lowResolutionIcons: false
                }
            },
            safariPinnedTab: {
                pictureAspect: 'blackAndWhite',
                threshold: 50,
                themeColor: '#5bbad5'
            }
        },
        settings: {
            scalingAlgorithm: 'Mitchell',
            errorOnImageTooSmall: false,
            readmeFile: false,
            htmlCodeFile: false,
            usePathAsIs: false
        },
        markupFile: FAVICON_DATA_FILE
    }, cb);
}

function favicon(cb) {
    if(fs.existsSync(FAVICON_DATA_FILE)) {
        let currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
        realfavicon.checkForUpdates(currentVersion,(err)=>{
            if(err) {
                throw err;
            } else {
                generatefav_impl(cb);
            }
        });
    } else {
        generatefav_impl(cb);
    }
}

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
    gulp.watch([path.watch.fonts], fonts);
}

function clean() {
    return del(path.clean);
}

let build = gulp.series(clean, favicon, gulp.parallel(images, js, css, html, fonts));
let watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.favicon = favicon;
exports.default = watch;
