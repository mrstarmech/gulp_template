let deploy_folder = "dist";
let src_folder = "src";

let path = {
    build: {
        html: deploy_folder + "/",
        css: deploy_folder + "/css/",
        js: deploy_folder + "/js/",
        img: deploy_folder + "/img/",
        fonts: deploy_folder + "/fonts/"
    },
    src: {
        html: src_folder + "/index.html",
        css: src_folder + "/scss/meta_style.scss",
        js: src_folder + "/js/meta_script.js",
        img: src_folder + "/img/**/*.{jpg,png,svg,webp,gif,ico}",
        ico: src_folder + "/img/**/*.json",
        fonts: src_folder + "/fonts/*",
        conf: src_folder + "/img/**/*.xml",
    },
    watch: {
        html: src_folder + "/**/*.html",
        css: src_folder + "/scss/**/*.scss",
        js: src_folder + "/js/**/*.js",
        img: src_folder + "/img/**/*.{jpg,png,svg,webp,gif,ico}"
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
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream());
}

function scopy() {
    src(path.src.conf)
        .pipe(dest(path.build.html));

    return src(path.src.ico)
        .pipe(dest(path.build.img))
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
            quality: 70
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.mozjpeg({quality: 75, progressive: true}),
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

function watchFiles() {
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], images);
}

function clean() {
    return del(path.clean);
}

let build = gulp.series(clean, gulp.parallel(images, scopy, js, css, html, fonts));
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fonts = fonts;
exports.images = images;
exports.scopy = scopy;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
