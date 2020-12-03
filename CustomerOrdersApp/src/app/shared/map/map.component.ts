/// <reference path="../../../../node_modules/bingmaps/types/MicrosoftMaps/Microsoft.Maps.d.ts" />

import {
  Component, OnInit, AfterContentInit, Input, ViewChild,
  ContentChildren, ElementRef, QueryList, ChangeDetectionStrategy
} from '@angular/core';

import { debounceTime } from 'rxjs/operators';
import { MapPointComponent } from './map-point.component';
import { IMapDataPoint } from '../../shared/interfaces';

@Component({
  selector: 'cm-map',
  templateUrl: './map.component.html',
  // When using OnPush detectors, then the framework will check an OnPush
  // component when any of its input properties changes, when it fires
  // an event, or when an observable fires an event ~ Victor Savkin (Angular Team)
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent implements OnInit, AfterContentInit {

  private isEnabled: boolean;
  private loadingScript: boolean;
  private map: Microsoft.Maps.Map;
  private infobox: Microsoft.Maps.Infobox;
  mapHeight: string;
  mapWidth: string;

  @Input() height: number;
  @Input() width: number;
  @Input() latitude = 34.5133;
  @Input() longitude = -94.1629;
  @Input() pinText = 'Your Location';
  @Input() zoom = 8;
  private _dataPoints: IMapDataPoint[] = null;
  @Input() public get dataPoints() {
    return this._dataPoints;
  }

  public set dataPoints(value: any[]) {
    this._dataPoints = value;
    this.renderMapPoints();
  }

  // Necessary since a map rendered while container is hidden
  // will not load the map tiles properly and show a grey screen
  @Input() get enabled(): boolean {
    return this.isEnabled;
  }

  set enabled(isEnabled: boolean) {
    this.isEnabled = isEnabled;
    this.init();
  }

  @ViewChild('mapContainer', { static: true }) mapDiv: ElementRef;
  @ContentChildren(MapPointComponent) mapPoints: QueryList<MapPointComponent>;

  constructor() { }

  ngOnInit() {
    if (this.latitude && this.longitude) {
      if (this.mapHeight && this.mapWidth) {
        this.mapHeight = this.height + 'px';
        this.mapWidth = this.width + 'px';
      } else {
        const hw = this.getWindowHeightWidth(this.mapDiv.nativeElement.ownerDocument);
        this.mapHeight = hw.height / 2 + 'px';
        this.mapWidth = hw.width + 'px';
      }
    }
  }

  ngAfterContentInit() {
    this.mapPoints.changes
        .pipe(
          debounceTime(500)
        )
        .subscribe(() => {
          if (this.enabled) { 
            this.renderMapPoints(); 
          }
        });
  }

  init() {
    // Need slight delay to avoid grey box when google script has previously been loaded.
    // Otherwise map <div> container may not be visible yet which causes the grey box.
    setTimeout(() => {
      this.ensureScript();
    }, 200);
  }

  private getWindowHeightWidth(document: HTMLDocument) {
    let width = window.innerWidth
      || document.documentElement.clientWidth
      || document.body.clientWidth;

    const height = window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight;

    if (width > 900) { width = 900; }

    return { height: height, width: width };
  }

  private ensureScript() {
    this.loadingScript = true;
    const document = this.mapDiv.nativeElement.ownerDocument;
    const script = <HTMLScriptElement>document.querySelector('script[id="bingmaps"]');
    if (script) {
      if (this.isEnabled) { this.renderMap(); }
    } else {
      const mapsScript = document.createElement('script');
      mapsScript.id = 'bingmaps';
      mapsScript.type = 'text/javascript';
      mapsScript.async = true;
      mapsScript.defer = true;
      mapsScript.src = 'https://www.bing.com/api/maps/mapcontrol?callback=__onBingMapLoaded';
      mapsScript.onload = () => {
        this.loadingScript = false;
        if (this.isEnabled) { 
          // Set callback for when bing maps is loaded.
          window['__onBingMapLoaded'] = (ev) => {
            this.renderMap(); 
          };
        }
      };
      document.body.appendChild(mapsScript);
    }
  }

  private renderMap() {
    const latlng = this.createLatLong(this.latitude, this.longitude);
    const options: Microsoft.Maps.IMapLoadOptions = {
      credentials: 'At1jz5shJJehBl94CpvgIIdaqVGcpOGfpkpU2nU4rRl3sV1MxWVMVYX92kXoLg5i',
      zoom: this.zoom,
      center: latlng,
      mapTypeId: Microsoft.Maps.MapTypeId.road
    };

    this.map = new Microsoft.Maps.Map(this.mapDiv.nativeElement, options);
    this.infobox = new Microsoft.Maps.Infobox(this.map.getCenter(), {
      visible: false
    });
    this.infobox.setMap(this.map);

    // See if we have any mapPoints (child content) or dataPoints (@Input property)
    if ((this.mapPoints && this.mapPoints.length) || (this.dataPoints && this.dataPoints.length)) {
      this.renderMapPoints();
    } else {
      this.createPin(latlng, this.pinText);
    }
  }

  private createLatLong(latitude: number, longitude: number) {
    return (latitude && longitude) ? new Microsoft.Maps.Location(latitude, longitude) : null;
  }

  private renderMapPoints() {
    if (this.map) {
      this.clearMapPoints();

      // lon/lat can be passed as child content or via the dataPoints @Input property
      const mapPoints = (this.mapPoints && this.mapPoints.length) ? this.mapPoints : this.dataPoints;

      if (mapPoints) {
        for (const point of mapPoints) {
          let pinText = (point.markerText) ? point.markerText : `${point.firstName} ${point.lastName}`;
          const mapPointLatlng = this.createLatLong(point.latitude, point.longitude);
          this.createPin(mapPointLatlng, pinText);
        }
      }
    }
  }

  private clearMapPoints() {
    this.map.entities.clear();
  }

  private createPin(location: Microsoft.Maps.Location, title: string) {
    let pin = new Microsoft.Maps.Pushpin(location);
    pin.metadata = {
      title
    };
    Microsoft.Maps.Events.addHandler(pin, 'click', (e) => this.pushPinClicked(e));
    this.map.entities.push(pin);
  }

  pushPinClicked(e: any) {
    //Make sure the infobox has metadata to display.
    if (e.target.metadata) {
        //Set the infobox options with the metadata of the pushpin.
        this.infobox.setOptions({
            location: e.target.getLocation(),
            title: e.target.metadata.title,
            description: e.target.metadata.description,
            visible: true
        });
    }
  }

}
