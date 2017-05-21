import React, { Component } from 'react';
import PointsMap from './PointsMap';
import { Dropdown } from 'semantic-ui-react';
import $ from 'jquery'; 
import { Map, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';

const endpoint = "//mapc-admin.carto.com/api/v2/sql?q=";
const muni_id = window.muni_id || 1;

class StreetDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = { 
      initialStreets: [{
        name: '',
        value: 1
      }],
      intersectingStreets: [{
        name: '',
        value: 1
      }],
      customPoint: null,
      selectedIntersection: null,
      selectedIntersectionIndex: 0,
      points: [{ lat: 42, lng: -71 }, { lat: 42, lng: -72 }],
      lat: 42,
      lng: -71,
      zoom: 17
    };
    this.query = '';
  }

  componentDidMount() {
    this.InitialStreets();
  }

  InitialStreets() {
    return $.getJSON(`${endpoint}SELECT DISTINCT(st_name_1) AS text%20, st_name_1 AS value FROM%20%22mapc-admin%22.survey_intersection%20WHERE town_id=${muni_id}`)
      .then((data) => {
        this.setState({ initialStreets: data.rows });
      });
  }

  IntersectingStreets(street) {
    let encodedStreet = street;
    return $.getJSON(`${endpoint}SELECT DISTINCT(st_name_2) AS text, st_name_2 AS value FROM%20%22mapc-admin%22.survey_intersection%20WHERE st_name_1='${encodedStreet}' AND town_id=${muni_id}`)
      .then((data) => {
        this.setState({ intersectingStreets: data.rows });
        this.IntersectingPoints(street);
      });
  }

  IntersectingPoints = (street) => {
    let encodedStreet = street;
    return $.getJSON(`${endpoint}SELECT DISTINCT(st_name_2) AS text, lat, long AS lng FROM%20%22mapc-admin%22.survey_intersection%20WHERE st_name_1='${encodedStreet}' AND town_id=${muni_id}`)
      .then((data) => {
        let latlngs = data.rows.map((row) => { return [row.lat,row.lng]; });
        let center = new L.LatLngBounds(latlngs).getCenter();

        this.setState({ points: data.rows, 
                        lat: center.lat, 
                        lng: center.lng });
      });
  }

  OnDropdownChange = (event, data) => {
    this.setState({selectedIntersectionIndex: 0})
    this.IntersectingStreets(data.value);
  }

  OnIntersectingPointsChange = (event, data) => {
    let chosenIndex = data.options.findIndex((el) => { return el.value === data.value });
    this.setState({ selectedIntersectionIndex: chosenIndex, customPoint: null });
  }

  OnMarkerClick = (index, marker) => {
    this.setState({ selectedIntersectionIndex: index, customPoint: null });
  }

  AddCustomPoint = (loc) => {
    this.setState({ customPoint: { lat: loc.latlng.lat, lng: loc.latlng.lng } });
  }

  render() {
    let initialStreets = this.state.initialStreets,
        intersectingStreets = this.state.intersectingStreets,
        selectedIntersection = this.state.points[this.state.selectedIntersectionIndex],
        onFirstChange = this.OnDropdownChange,
        onSecondChange = this.OnIntersectingPointsChange,
        onMarkerClick = this.OnMarkerClick,
        chosenLatLng = this.state.customPoint || selectedIntersection;

    return (
      <div className="ui equal width grid">
        <div className="row">
          <PointsMap  zoom={this.state.zoom} 
                      points={this.state.points} 
                      center={[this.state.lat,this.state.lng]} 
                      onMarkerClick={onMarkerClick}
                      customPoint={this.state.customPoint}
                      addCustomPoint={this.AddCustomPoint} />
        </div>
        <div className="row">
          <div className="column">
            <Dropdown placeholder='Search for Street' fluid search selection 
                      options={ initialStreets } 
                      onChange={onFirstChange} />
          </div>
          <div className="column">
            <Dropdown placeholder='Search for Intersecting Street' fluid search 
                      value={selectedIntersection['text'] } selection 
                      options={ intersectingStreets } 
                      onChange={onSecondChange} />
          </div>
          <input type="hidden" name="point" value={`${chosenLatLng['lat']} ${chosenLatLng['lng']}`} />
        </div>
      </div>
    )
  }
}

export default StreetDropdown
