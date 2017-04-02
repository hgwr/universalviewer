import {BaseEvents} from "../uv-shared-module/BaseEvents";
import {Bounds} from "../../extensions/uv-seadragon-extension/Bounds";
import {CenterPanel} from "../uv-shared-module/CenterPanel";
import {Events} from "../../extensions/uv-seadragon-extension/Events";
import {CroppedImageDimensions} from "../../extensions/uv-seadragon-extension/CroppedImageDimensions";
import {ISeadragonExtension} from "../../extensions/uv-seadragon-extension/ISeadragonExtension";
import {ISeadragonExtensionData} from "../../extensions/uv-seadragon-extension/ISeadragonExtensionData";
import {MetricType} from "../uv-shared-module/MetricType";
import SearchResult = Manifold.SearchResult;
import SearchResultRect = Manifold.SearchResultRect;

export class SeadragonCenterPanel extends CenterPanel {

    controlsVisible: boolean = false;
    currentBounds: any;
    currentSearchResultRect: SearchResultRect;
    handler: any;
    initialBounds: any;
    initialRotation: any;
    isCreated: boolean = false;
    isFirstLoad: boolean = true;
    items: any[];
    nextButtonEnabled: boolean = false;
    pages: Manifold.ExternalResource[];
    prevButtonEnabled: boolean = false;
    previousSearchResultRect: SearchResultRect;
    title: string;
    userData: any;
    viewer: any;

    $canvas: JQuery;
    $goHomeButton: JQuery;
    $navigator: JQuery;
    $nextButton: JQuery;
    $prevButton: JQuery;
    $rotateButton: JQuery;
    $spinner: JQuery;
    $viewer: JQuery;
    $viewportNavButtonsContainer: JQuery;
    $viewportNavButtons: JQuery;
    $zoomInButton: JQuery;
    $zoomOutButton: JQuery;

    constructor($element: JQuery) {
        super($element);
    }

    create(): void {

        this.setConfig('seadragonCenterPanel');

        super.create();

        this.$viewer = $('<div id="viewer"></div>');
        this.$content.prepend(this.$viewer);

        $.subscribe(BaseEvents.SETTINGS_CHANGED, (e: any, args: any) => {
            this.viewer.gestureSettingsMouse.clickToZoom = args.clickToZoomEnabled;
        });

        $.subscribe(BaseEvents.OPEN_EXTERNAL_RESOURCE, (e: any, resources: Manifold.ExternalResource[]) => {
            this.whenResized(() => {
                if (!this.isCreated) this.createUI();
                this.openMedia(resources);
            });
        });

        $.subscribe(Events.CLEAR_SEARCH, () => {
            this.whenCreated(() => {
                (<ISeadragonExtension>this.extension).currentSearchResultRect = null;
                this.clearSearchResults();
            });
        });

        $.subscribe(Events.VIEW_PAGE, () => {
            (<ISeadragonExtension>this.extension).previousSearchResultRect = null;
            (<ISeadragonExtension>this.extension).currentSearchResultRect = null;
        });

        $.subscribe(Events.NEXT_SEARCH_RESULT, () => {
            this.whenCreated(() => {
                this.nextSearchResult();
            });
        });

        $.subscribe(Events.PREV_SEARCH_RESULT, () => {
            this.whenCreated(() => {
                this.prevSearchResult();
            });
        });

        $.subscribe(Events.ZOOM_IN, () => {
            this.whenCreated(() => {
                this.zoomIn();
            });
        });

        $.subscribe(Events.ZOOM_OUT, () => {
            this.whenCreated(() => {
                this.zoomOut();
            });
        });

        $.subscribe(Events.ROTATE, () => {
            this.whenCreated(() => {
                this.rotateRight();
            });
        });

        $.subscribe(BaseEvents.METRIC_CHANGED, () => {
            this.whenCreated(() => {
                this.updateResponsiveView();
            });
        });
    }

    whenResized(cb: () => void): void {
        Utils.Async.waitFor(() => {
            return this.isResized;
        }, cb);
    }

    whenCreated(cb: () => void): void {
        Utils.Async.waitFor(() => {
            return this.isCreated;
        }, cb);
    }

    zoomIn(): void {
        this.viewer.viewport.zoomTo(this.viewer.viewport.getZoom(true) * 2);
    }

    zoomOut(): void {
        this.viewer.viewport.zoomTo(this.viewer.viewport.getZoom(true) * 0.5);
    }

    rotateRight(): void {
        this.viewer.viewport.setRotation(this.viewer.viewport.getRotation() + 90);
    }

    updateResponsiveView(): void {
        this.setNavigatorVisible();
        
        if (this.extension.metric.toString() === MetricType.MOBILELANDSCAPE.toString()) {
            this.viewer.autoHideControls = false;
            this.$viewportNavButtons.hide();
        } else {
            this.viewer.autoHideControls = true;
            this.$viewportNavButtons.show();
        }
    }

    createUI(): void {

        this.$spinner = $('<div class="spinner"></div>');
        this.$content.append(this.$spinner);

        this.updateAttribution();

        // add to window object for testing automation purposes.
        window.openSeadragonViewer = this.viewer = OpenSeadragon({
            id: "viewer",
            ajaxWithCredentials: false,
            showNavigationControl: true,
            showNavigator: true,
            showRotationControl: true,
            showHomeControl: Utils.Bools.getBool(this.config.options.showHomeControl, false),
            showFullPageControl: false,
            defaultZoomLevel: this.config.options.defaultZoomLevel || 0,
            maxZoomPixelRatio: this.config.options.maxZoomPixelRatio || 2,
            controlsFadeDelay: this.config.options.controlsFadeDelay || 250,
            controlsFadeLength: this.config.options.controlsFadeLength || 250,
            navigatorPosition: this.config.options.navigatorPosition || "BOTTOM_RIGHT",
            animationTime: this.config.options.animationTime || 1.2,
            visibilityRatio: this.config.options.visibilityRatio || 0.5,
            constrainDuringPan: Utils.Bools.getBool(this.config.options.constrainDuringPan, false),
            immediateRender: Utils.Bools.getBool(this.config.options.immediateRender, false),
            blendTime: this.config.options.blendTime || 0,
            autoHideControls: Utils.Bools.getBool(this.config.options.autoHideControls, true),
            prefixUrl: this.extension.data.root + '/img/',
            gestureSettingsMouse: {
                clickToZoom: Utils.Bools.getBool(this.extension.data.config.options.clickToZoomEnabled, true)
            },
            navImages: {
                zoomIn: {
                    REST:   'pixel.gif',
                    GROUP:  'pixel.gif',
                    HOVER:  'pixel.gif',
                    DOWN:   'pixel.gif'
                },
                zoomOut: {
                    REST:   'pixel.gif',
                    GROUP:  'pixel.gif',
                    HOVER:  'pixel.gif',
                    DOWN:   'pixel.gif'
                },
                home: {
                    REST:   'pixel.gif',
                    GROUP:  'pixel.gif',
                    HOVER:  'pixel.gif',
                    DOWN:   'pixel.gif'
                },
                rotateright: {
                    REST:   'pixel.gif',
                    GROUP:  'pixel.gif',
                    HOVER:  'pixel.gif',
                    DOWN:   'pixel.gif'
                },
                rotateleft: {
                    REST:   'pixel.gif',
                    GROUP:  'pixel.gif',
                    HOVER:  'pixel.gif',
                    DOWN:   'pixel.gif'
                },
                next: {
                    REST:   'pixel.gif',
                    GROUP:  'pixel.gif',
                    HOVER:  'pixel.gif',
                    DOWN:   'pixel.gif'
                },
                previous: {
                    REST:   'pixel.gif',
                    GROUP:  'pixel.gif',
                    HOVER:  'pixel.gif',
                    DOWN:   'pixel.gif'
                }
            }
        });

        this.$zoomInButton = this.$viewer.find('div[title="Zoom in"]');
        this.$zoomInButton.attr('tabindex', 0);
        this.$zoomInButton.prop('title', this.content.zoomIn);
        this.$zoomInButton.addClass('zoomIn viewportNavButton');

        this.$zoomOutButton = this.$viewer.find('div[title="Zoom out"]');
        this.$zoomOutButton.attr('tabindex', 0);
        this.$zoomOutButton.prop('title', this.content.zoomOut);
        this.$zoomOutButton.addClass('zoomOut viewportNavButton');

        this.$goHomeButton = this.$viewer.find('div[title="Go home"]');
        this.$goHomeButton.attr('tabindex', 0);
        this.$goHomeButton.prop('title', this.content.goHome);
        this.$goHomeButton.addClass('goHome viewportNavButton');

        this.$rotateButton = this.$viewer.find('div[title="Rotate right"]');
        this.$rotateButton.attr('tabindex', 0);
        this.$rotateButton.prop('title', this.content.rotateRight);
        this.$rotateButton.addClass('rotate viewportNavButton');
        
        this.$viewportNavButtonsContainer = this.$viewer.find('.openseadragon-container > div:not(.openseadragon-canvas):first');
        this.$viewportNavButtons = this.$viewportNavButtonsContainer.find('.viewportNavButton');

        this.$canvas = $(this.viewer.canvas);

        this.$canvas.on('contextmenu', () => { return false; });

        this.$navigator = this.$viewer.find(".navigator");
        this.setNavigatorVisible();

        // events

        this.$element.on('mousemove', () => {
            if (this.controlsVisible) return;
            this.controlsVisible = true;
            this.viewer.setControlsEnabled(true);
        });

        this.$element.on('mouseleave', () => {
            if (!this.controlsVisible) return;
            this.controlsVisible = false;
            this.viewer.setControlsEnabled(false);
        });

        // when mouse move stopped
        this.$element.on('mousemove', () => {
            // if over element, hide controls.
            if (!this.$viewer.find('.navigator').ismouseover()) {
                if (!this.controlsVisible) return;
                this.controlsVisible = false;
                this.viewer.setControlsEnabled(false);
            }
        }, this.config.options.controlsFadeAfterInactive);

        this.viewer.addHandler('tile-drawn', () => {
            this.$spinner.hide();
        });

        //this.viewer.addHandler("open-failed", () => {
        //});

        this.viewer.addHandler('resize', (viewer: any) => {
            $.publish(Events.SEADRAGON_RESIZE, [viewer]);
            this.viewerResize(viewer);
        });

        this.viewer.addHandler('animation-start', (viewer: any) => {
            $.publish(Events.SEADRAGON_ANIMATION_START, [viewer]);
        });

        this.viewer.addHandler('animation', (viewer: any) => {
            $.publish(Events.SEADRAGON_ANIMATION, [viewer]);
        });

        this.viewer.addHandler('animation-finish', (viewer: any) => {
            this.currentBounds = this.getViewportBounds();

            this.updateVisibleSearchResultRects();

            $.publish(Events.SEADRAGON_ANIMATION_FINISH, [viewer]);
        });

        this.viewer.addHandler('rotate', (args: any) => {
            $.publish(Events.SEADRAGON_ROTATION, [args.degrees]);
        });

        this.title = this.extension.helper.getLabel();

        this.createNavigationButtons();
        this.hidePrevButton();
        this.hideNextButton();

        this.isCreated = true;

        this.resize();
    }

    createNavigationButtons() {

        const viewingDirection: Manifesto.ViewingDirection = this.extension.helper.getViewingDirection();

        this.$prevButton = $('<div class="paging btn prev" tabindex="0"></div>');
        this.$prevButton.prop('title', this.content.previous);

        this.$nextButton = $('<div class="paging btn next" tabindex="0"></div>');
        this.$nextButton.prop('title', this.content.next);
        
        this.viewer.addControl(this.$prevButton[0], {anchor: OpenSeadragon.ControlAnchor.TOP_LEFT});
        this.viewer.addControl(this.$nextButton[0], {anchor: OpenSeadragon.ControlAnchor.TOP_RIGHT});

        switch (viewingDirection.toString()) {
            case manifesto.ViewingDirection.bottomToTop().toString() :
            case manifesto.ViewingDirection.topToBottom().toString() :
                this.$prevButton.addClass('vertical');
                this.$nextButton.addClass('vertical');;
                break;
        }

        const that = this;

        this.$prevButton.onPressed((e: any) => {
            e.preventDefault();
            OpenSeadragon.cancelEvent(e);

            if (!that.prevButtonEnabled) return;

            switch (viewingDirection.toString()) {
                case manifesto.ViewingDirection.leftToRight().toString() :
                case manifesto.ViewingDirection.bottomToTop().toString() :
                case manifesto.ViewingDirection.topToBottom().toString() :
                    $.publish(Events.PREV);
                    break;
                case manifesto.ViewingDirection.rightToLeft().toString() :
                    $.publish(Events.NEXT);
                    break;
            }
        });

        this.$nextButton.onPressed((e: any) => {
            e.preventDefault();
            OpenSeadragon.cancelEvent(e);

            if (!that.nextButtonEnabled) return;

            switch (viewingDirection.toString()) {
                case manifesto.ViewingDirection.leftToRight().toString() :
                case manifesto.ViewingDirection.bottomToTop().toString() :
                case manifesto.ViewingDirection.topToBottom().toString() :
                    $.publish(Events.NEXT);
                    break;
                case manifesto.ViewingDirection.rightToLeft().toString() :
                    $.publish(Events.PREV);
                    break;
            }
        });
    }

    openMedia(resources?: Manifold.ExternalResource[]): void {

        this.$spinner.show();
        this.items = [];

        // todo: this should be a more specific Manifold.IImageResource
        this.extension.getExternalResources(resources).then((resources: Manifold.ExternalResource[]) => {
            // OSD can open an array info.json objects
            //this.viewer.open(resources);

            this.viewer.close();

            resources = this.getPagePositions(resources);

            for (let i = 0; i < resources.length; i++) {
                const resource: Manifold.ExternalResource = resources[i];
                this.viewer.addTiledImage({
                    tileSource: resource,
                    x: resource.x,
                    y: resource.y,
                    width: resource.width,
                    success: (item: any) => {
                        this.items.push(item);
                        if (this.items.length === resources.length) {
                            this.openPagesHandler();
                        }
                        this.resize();
                    }
                });
            }
        });
    }

    getPagePositions(resources: Manifold.ExternalResource[]): Manifold.ExternalResource[] {
        let leftPage: any;
        let rightPage: any;
        let topPage: any;
        let bottomPage: any;
        let page: any;
        let nextPage: any;

        // if there's more than one image, determine alignment strategy
        if (resources.length > 1) {

            if (resources.length === 2) {
                // recto verso
                if (this.extension.helper.isVerticallyAligned()) {
                    // vertical alignment
                    topPage = resources[0];
                    topPage.y = 0;
                    bottomPage = resources[1];
                    bottomPage.y = topPage.height + this.config.options.pageGap;
                } else {
                    // horizontal alignment
                    leftPage = resources[0];
                    leftPage.x = 0;
                    rightPage = resources[1];
                    rightPage.x = leftPage.width + this.config.options.pageGap;
                }
            } else {
                // scroll
                if (this.extension.helper.isVerticallyAligned()) {
                    // vertical alignment
                    if (this.extension.helper.isTopToBottom()) {
                        // top to bottom
                        for (let i = 0; i < resources.length - 1; i++) {
                            page = resources[i];
                            nextPage = resources[i + 1];
                            nextPage.y = (page.y || 0) + page.height;;
                        }
                    } else {
                        // bottom to top
                        for (let i = resources.length; i > 0; i--) {
                            page = resources[i];
                            nextPage = resources[i - 1];
                            nextPage.y = (page.y || 0) - page.height;
                        }
                    }
                } else {
                    // horizontal alignment
                    if (this.extension.helper.isLeftToRight()) {
                        // left to right
                        for (let i = 0; i < resources.length - 1; i++) {
                            page = resources[i];
                            nextPage = resources[i + 1];
                            nextPage.x = (page.x || 0) + page.width;
                        }
                    } else {
                        // right to left
                        for (let i = resources.length - 1; i > 0; i--) {
                            page = resources[i];
                            nextPage = resources[i - 1];
                            nextPage.x = (page.x || 0) - page.width;
                        }
                    }
                }
            }
        }

        return resources;
    }

    openPagesHandler(): void {

        $.publish(Events.SEADRAGON_OPEN);

        if (this.extension.helper.isMultiCanvas() && !this.extension.helper.isContinuous()) {

            this.showPrevButton();
            this.showNextButton();

            $('.navigator').addClass('extraMargin');

            const viewingDirection: Manifesto.ViewingDirection = this.extension.helper.getViewingDirection();

            if (viewingDirection.toString() === manifesto.ViewingDirection.rightToLeft().toString()) {
                if (this.extension.helper.isFirstCanvas()) {
                    this.disableNextButton();
                } else {
                    this.enableNextButton();
                }

                if (this.extension.helper.isLastCanvas()) {
                    this.disablePrevButton();
                } else {
                    this.enablePrevButton();
                }
            } else {
                if (this.extension.helper.isFirstCanvas()) {
                    this.disablePrevButton();                    
                } else {
                    this.enablePrevButton();
                }

                if (this.extension.helper.isLastCanvas()) {
                    this.disableNextButton();
                } else {
                    this.enableNextButton();
                }
            }
        }
        
        this.setNavigatorVisible();
        this.overlaySearchResults();
        this.updateBounds();

        let searchResultRect: SearchResultRect | null = this.getInitialSearchResultRect();

        (<ISeadragonExtension>this.extension).previousSearchResultRect = null;
        (<ISeadragonExtension>this.extension).currentSearchResultRect = null;

        if (searchResultRect && this.isZoomToSearchResultEnabled()) {
            this.zoomToSearchResult(searchResultRect);
        }

        this.isFirstLoad = false;
    }

    updateBounds(): void {

        const settings: ISettings = this.extension.getSettings();

        // if this is the first load and there are initial bounds, fit to those.
        if (this.isFirstLoad) {

            this.initialRotation = (<ISeadragonExtensionData>this.extension.data).rotation;

            if (this.initialRotation) {
                this.viewer.viewport.setRotation(parseInt(this.initialRotation));
            }

            this.initialBounds = (<ISeadragonExtensionData>this.extension.data).xywh;

            if (this.initialBounds) {
                this.initialBounds = Bounds.fromString(this.initialBounds);
                this.currentBounds = this.initialBounds;
                this.fitToBounds(this.currentBounds);
            }
        } else if (settings.preserveViewport) { // if this isn't the first load and preserveViewport is enabled, fit to the current bounds.
            this.fitToBounds(this.currentBounds);
        } else {
            this.goHome();
        }
    }

    goHome(): void {        
        this.viewer.viewport.goHome(true);
    }

    disablePrevButton(): void {
        this.prevButtonEnabled = false;
        this.$prevButton.addClass('disabled');
    }

    enablePrevButton(): void {
        this.prevButtonEnabled = true;
        this.$prevButton.removeClass('disabled');
    }

    hidePrevButton(): void {
        this.disablePrevButton();
        this.$prevButton.hide();
    }

    showPrevButton(): void {
        this.enablePrevButton();
        this.$prevButton.show();
    }

    disableNextButton(): void {
        this.nextButtonEnabled = false;
        this.$nextButton.addClass('disabled');
    }

    enableNextButton(): void {
        this.nextButtonEnabled = true;
        this.$nextButton.removeClass('disabled');
    }

    hideNextButton(): void {
        this.disableNextButton();
        this.$nextButton.hide();
    }

    showNextButton(): void {
        this.enableNextButton();
        this.$nextButton.show();
    }

    fitToBounds(bounds: Bounds, immediate: boolean = true): void {
        const rect = new OpenSeadragon.Rect();
        rect.x = Number(bounds.x);
        rect.y = Number(bounds.y);
        rect.width = Number(bounds.w);
        rect.height = Number(bounds.h);

        this.viewer.viewport.fitBoundsWithConstraints(rect, immediate);
    }

    getCroppedImageBounds(): string | null {

        if (!this.viewer || !this.viewer.viewport) return null;

        const canvas: Manifesto.ICanvas = this.extension.helper.getCurrentCanvas();
        const dimensions: CroppedImageDimensions | null = (<ISeadragonExtension>this.extension).getCroppedImageDimensions(canvas, this.viewer);

        if (dimensions) {
            const bounds: Bounds = new Bounds(dimensions.regionPos.x, dimensions.regionPos.y, dimensions.region.width, dimensions.region.height);
            return bounds.toString();
        }
        
        return null;
    }

    getViewportBounds(): Bounds | null {

        if (!this.viewer || !this.viewer.viewport) return null;

        const b: any = this.viewer.viewport.getBounds(true);
        const bounds: Bounds = new Bounds(Math.floor(b.x), Math.floor(b.y), Math.floor(b.width), Math.floor(b.height));

        return bounds;
    }

    viewerResize(viewer: any): void {

        if (!viewer.viewport) return;

        const center = viewer.viewport.getCenter(true);
        if (!center) return;

        // postpone pan for a millisecond - fixes iPad image stretching/squashing issue.
        setTimeout(function () {
            viewer.viewport.panTo(center, true);
        }, 1);
    }

    clearSearchResults(): void {
        this.$canvas.find('.searchOverlay').hide();
    }

    overlaySearchResults(): void {
        const searchResults: SearchResult[] = this.getSearchResultsForCurrentImages();

        for (let i = 0; i < searchResults.length; i++) {

            const searchResult: SearchResult = searchResults[i];
            const overlayRects: any[] = this.getSearchOverlayRects(searchResult);

            for (let k = 0; k < overlayRects.length; k++) {
                const overlayRect = overlayRects[k];

                const div: HTMLElement = document.createElement('div');
                div.id = 'searchResult-' + overlayRect.canvasIndex + '-' + overlayRect.resultIndex;
                div.className = 'searchOverlay';
                div.title = this.extension.sanitize(overlayRect.chars);

                this.viewer.addOverlay(div, overlayRect);
            }
        }
    }

    getSearchResultsForCurrentImages(): SearchResult[] {
        let searchResultsForCurrentImages: SearchResult[] = [];
        const searchResults: SearchResult[] | null = (<ISeadragonExtension>this.extension).searchResults;

        if (!searchResults || !searchResults.length) return searchResultsForCurrentImages;

        const indices: number[] = this.extension.getPagedIndices();

        for (let i = 0; i < indices.length; i++) {
            const canvasIndex = indices[i];

            for (let j = 0; j < searchResults.length; j++) {
                if (searchResults[j].canvasIndex === canvasIndex) {
                    searchResultsForCurrentImages.push(searchResults[j]);
                    break;
                }
            }
        }

        return searchResultsForCurrentImages;
    }

    getSearchResultRectsForCurrentImages(): SearchResultRect[] {
        const searchResults: SearchResult[] = this.getSearchResultsForCurrentImages();
        return searchResults.en().selectMany(x => x.rects).toArray();
    }

    updateVisibleSearchResultRects(): void {
        // after animating, loop through all search result rects and flag their visibility based on whether they are inside the current viewport.
        const searchResultRects: SearchResultRect[] = this.getSearchResultRectsForCurrentImages();

        for (let i = 0; i < searchResultRects.length; i++) {
            let rect: SearchResultRect = searchResultRects[i];
            let viewportBounds: any = this.viewer.viewport.getBounds();

            rect.isVisible = Utils.Measurements.Dimensions.hitRect(viewportBounds.x, viewportBounds.y, viewportBounds.width, viewportBounds.height, rect.viewportX, rect.viewportY);
        }
    }

    getSearchResultRectIndex(searchResultRect: SearchResultRect): number {
        const searchResultRects: SearchResultRect[] = this.getSearchResultRectsForCurrentImages();
        return searchResultRects.indexOf(searchResultRect);
    }

    isZoomToSearchResultEnabled(): boolean {
        return Utils.Bools.getBool(this.extension.data.config.options.zoomToSearchResultEnabled, true);
    }

    nextSearchResult(): void {
        const searchResultRects: SearchResultRect[] = this.getSearchResultRectsForCurrentImages();
        const searchResultRect: SearchResultRect | null = (<ISeadragonExtension>this.extension).currentSearchResultRect;

        if (!searchResultRect) return;

        const currentSearchResultRectIndex: number = this.getSearchResultRectIndex(searchResultRect);
        let foundRect: SearchResultRect | null = null;

        for (let i = currentSearchResultRectIndex + 1; i < searchResultRects.length; i++) {
            const rect: SearchResultRect = searchResultRects[i];

            // this was removed as users found it confusing.
            // find the next visible or non-visible rect.
            //if (rect.isVisible) {
            //    continue;
            //} else {
                foundRect = rect;
                break;
            //}
        }

        if (foundRect && this.isZoomToSearchResultEnabled()) {
            // if the rect's canvasIndex is greater than the current canvasIndex
            if (foundRect.canvasIndex > this.extension.helper.canvasIndex) {
                (<ISeadragonExtension>this.extension).currentSearchResultRect = foundRect;
                $.publish(Events.SEARCH_RESULT_CANVAS_CHANGED, [foundRect]);
            } else {
                this.zoomToSearchResult(<SearchResultRect>foundRect);
            }
        } else {
            $.publish(Events.NEXT_IMAGES_SEARCH_RESULT_UNAVAILABLE);
        }
    }

    prevSearchResult(): void {
        const searchResultRects: SearchResultRect[] = this.getSearchResultRectsForCurrentImages();
        const currentSearchResultRect: SearchResultRect | null = (<ISeadragonExtension>this.extension).currentSearchResultRect;

        if (!currentSearchResultRect) return;

        const currentSearchResultRectIndex: number = this.getSearchResultRectIndex(currentSearchResultRect);
        let foundRect: SearchResultRect | null = null;
   
        for (let i = currentSearchResultRectIndex - 1; i >= 0; i--) {
            const rect: SearchResultRect = searchResultRects[i];

            // this was removed as users found it confusing.
            // find the prev visible or non-visible rect.
            //if (rect.isVisible) {
            //    continue;
            //} else {
                foundRect = rect;
                break;
            //}
        }

        if (foundRect && this.isZoomToSearchResultEnabled()) {
            // if the rect's canvasIndex is less than the current canvasIndex
            if (foundRect.canvasIndex < this.extension.helper.canvasIndex) {
                (<ISeadragonExtension>this.extension).currentSearchResultRect = foundRect;
                $.publish(Events.SEARCH_RESULT_CANVAS_CHANGED, [foundRect]);
            } else {
                this.zoomToSearchResult(foundRect);
            }
        } else {
            $.publish(Events.PREV_IMAGES_SEARCH_RESULT_UNAVAILABLE);
        }
    }

    getSearchResultRectByIndex(index: number): SearchResultRect | null {
        const searchResultRects: SearchResultRect[] = this.getSearchResultRectsForCurrentImages();
        if (!searchResultRects.length) return null;
        return searchResultRects[index];
    }

    getInitialSearchResultRect(): SearchResultRect | null {
        const searchResultRects: SearchResultRect[] = this.getSearchResultRectsForCurrentImages();
        if (!searchResultRects.length) return null;

        // if the previous SearchResultRect had a canvasIndex higher than the current canvasIndex
        const previousSearchResultRect: SearchResultRect | null = (<ISeadragonExtension>this.extension).previousSearchResultRect;

        if (previousSearchResultRect && previousSearchResultRect.canvasIndex > this.extension.helper.canvasIndex) {
            return searchResultRects.en().where(x => x.canvasIndex === this.extension.helper.canvasIndex).last();
        }

        // get the first rect with the current canvasindex.
        return searchResultRects.en().where(x => x.canvasIndex === this.extension.helper.canvasIndex).first();
    }

    zoomToSearchResult(searchResultRect: SearchResultRect): void {
        (<ISeadragonExtension>this.extension).previousSearchResultRect = (<ISeadragonExtension>this.extension).currentSearchResultRect || searchResultRect;
        (<ISeadragonExtension>this.extension).currentSearchResultRect = searchResultRect;

        this.fitToBounds(new Bounds(searchResultRect.viewportX, searchResultRect.viewportY, searchResultRect.width, searchResultRect.height), false);

        this.highlightSearchResultRect(searchResultRect);

        $.publish(Events.SEARCH_RESULT_RECT_CHANGED);
    }

    highlightSearchResultRect(searchResultRect: SearchResultRect): void {
        const $rect = $('#searchResult-' + searchResultRect.canvasIndex + '-' + searchResultRect.index);
        $rect.addClass('current');
        $('.searchOverlay').not($rect).removeClass('current');
    }

    getSearchOverlayRects(searchResult: SearchResult): any[] {
        let newRects: any[] = [];
        let resource: any = this.extension.resources.en().where(x => x.index === searchResult.canvasIndex).first();
        let index: number = this.extension.resources.indexOf(resource);
        let offsetX: number = 0;

        if (index > 0) {
            offsetX = this.extension.resources[index - 1].width;
        }

        for (let i = 0; i < searchResult.rects.length; i++) {
            const searchRect: SearchResultRect = searchResult.rects[i];

            const x: number = (searchRect.x + offsetX) + ((index > 0) ? this.config.options.pageGap : 0);
            const y: number = searchRect.y;
            const w: number = searchRect.width;
            const h: number = searchRect.height;

            const rect = new OpenSeadragon.Rect(x, y, w, h);
            searchRect.viewportX = x;
            searchRect.viewportY = y;
            rect.canvasIndex = searchRect.canvasIndex;
            rect.resultIndex = searchRect.index;
            rect.chars = searchRect.chars;

            newRects.push(rect);
        }

        return newRects;
    }

    resize(): void {

        super.resize();

        this.$viewer.height(this.$content.height() - this.$viewer.verticalMargins());
        this.$viewer.width(this.$content.width() - this.$viewer.horizontalMargins());

        if (!this.isCreated) return;

        this.$title.ellipsisFill(this.extension.sanitize(this.title));

        this.$spinner.css('top', (this.$content.height() / 2) - (this.$spinner.height() / 2));
        this.$spinner.css('left', (this.$content.width() / 2) - (this.$spinner.width() / 2));

        const viewingDirection: Manifesto.ViewingDirection = this.extension.helper.getViewingDirection();

        if (this.extension.helper.isMultiCanvas() && this.$prevButton && this.$nextButton) {

            const verticalButtonPos: number = Math.floor(this.$content.width() / 2);

            switch (viewingDirection.toString()) {
                case manifesto.ViewingDirection.bottomToTop().toString() :
                    this.$prevButton.addClass('down');
                    this.$nextButton.addClass('up');
                    this.$prevButton.css('left', verticalButtonPos - (this.$prevButton.outerWidth() / 2));
                    this.$prevButton.css('top', (this.$content.height() - this.$prevButton.height()));
                    this.$nextButton.css('left', (verticalButtonPos * -1) - (this.$nextButton.outerWidth() / 2));
                    break;
                case manifesto.ViewingDirection.topToBottom().toString() :
                    this.$prevButton.css('left', verticalButtonPos - (this.$prevButton.outerWidth() / 2));
                    this.$nextButton.css('left', (verticalButtonPos * -1) - (this.$nextButton.outerWidth() / 2));
                    this.$nextButton.css('top', (this.$content.height() - this.$nextButton.height()));
                    break;
                default :
                    this.$prevButton.css('top', (this.$content.height() - this.$prevButton.height()) / 2);
                    this.$nextButton.css('top', (this.$content.height() - this.$nextButton.height()) / 2);
                    break;
            }
        }

        // stretch navigator, allowing time for OSD to resize
        setTimeout(() => {
            if (this.extension.helper.isContinuous()){
                if (this.extension.helper.isHorizontallyAligned()){
                    const width: number = this.$viewer.width() - this.$viewer.rightMargin();
                    this.$navigator.width(width);
                } else {
                    this.$navigator.height(this.$viewer.height());
                }
            }
        }, 100);
    }

    setFocus(): void {
        if (!this.$canvas.is(":focus")) {
            if (this.extension.data.config.options.allowStealFocus) {
                this.$canvas.focus();
            }
        }
    }
    
    setNavigatorVisible(): void {

        const navigatorEnabled: boolean = Utils.Bools.getBool(this.extension.getSettings().navigatorEnabled, true) && this.extension.metric.toString() !== MetricType.MOBILELANDSCAPE.toString();

        this.viewer.navigator.setVisible(navigatorEnabled);
        
        if (navigatorEnabled) {
            this.$navigator.show();
        } else {
            this.$navigator.hide();
        }
    }
}