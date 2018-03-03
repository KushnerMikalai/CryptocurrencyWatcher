import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import './App.css';
import { XAxis, ReferenceArea, Brush, Tooltip, YAxis, Legend, CartesianGrid, LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';

var exchange = "Bitfinex";
var watchlist = ['BTC', 'ETH', 'XRP', 'BCH', 'EOS', 'BTG', 'LTC', 'NEO', 'DASH', 'XMR', 'ETC', 'ZEC', 'OMG', 'IOT']
var socket;
var listVisible = {};

for (var i = 0; i <= watchlist.length; i++) {
  listVisible[watchlist[i]] = true;
}

window.onscroll = function () {
  var scrolled = window.pageYOffset || document.documentElement.scrollTop;
}

const Watcher = ({ price, symbol, change, popupDelay, chartData, hidden }) => (
  <div className={`col-12 col-md-4 col-lg-3 ${hidden ? 'hidden' : 'show'}`}>
    <a className={`app__dashboard-watcher ${change > 0 ? 'gain' : 'lost'}`}
      target="_blank"
      href={`https://www.cryptocompare.com/coins/${symbol.toLowerCase()}/overview/${symbol}`}>
      <div className="chart">
        {hidden ? null :
          <ResponsiveContainer width="98%" height="100%">
            <AreaChart className={`${hidden ? 'hidden' : 'show'}`} data={chartData}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor='#ad3442' stopOpacity={0.8} />
                  <stop offset="95%" stopColor='#ad3442' stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUX" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor='#72b368' stopOpacity={0.8} />
                  <stop offset="95%" stopColor='#72b368' stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis />
              <XAxis />
              <CartesianGrid strokeDasharray="6" />
              <Tooltip dataKey="close" />
              <Area type="monotone" dataKey="close" stroke={change > 0 ? '#63b556' : '#ac2a39'} fillOpacity={1} fill={change > 0 ? "url(#colorUX)" : "url(#colorUv)"} />
            </AreaChart>
          </ResponsiveContainer>
        }
      </div>
      <div className="chart__name">{symbol}</div>
      <div className="chart__prise">${price}</div>
      <div className="chart__state">
        <span className="chart__indicator"></span>
        <span className="chart__change">{change}%</span>
      </div>
    </a>
  </div>
)

class App extends Component {
  constructor() {
    super();
    this.handleOnClick = this.handleOnClick.bind(this);
    this.showCoinsMobile = this.showCoinsMobile.bind(this);
    this.state = {
      watcher: watchlist,
      data: {},
      chartData: {},
      socket: ' Off',
      listVisible: listVisible,
      chartDataLength: null,
      cointsMobileShow: false
    };
  }

  componentDidMount() {
    socket = socketIOClient.connect('https://streamer.cryptocompare.com/');
    const subs = this.state.watcher.map(symbol => `2~${exchange}~${symbol}~USD`);
    socket.emit('SubAdd', { subs });
    socket.on("m", this.newChange.bind(this));
    socket.on('connect', () => this.setState({ socket: ' On' }));
    socket.on('disconnect', () => this.setState({ socket: ' Off' }));
    this.state.watcher.forEach(symbol => this.loadChart(symbol));
    setInterval(() => this.state.watcher.forEach(symbol => this.loadChart(symbol)), 4000);
    this.handleOnClick('BTC');
    this.handleOnClick('ETH');
  }

  loadChart(symbol) {
    fetch(`https://min-api.cryptocompare.com/data/histoday?fsym=${symbol}&tsym=USD&limit=120&aggregate=1&e=CCCAGG`)
      .then(res => res.json())
      .then(data => {
        console.log();
        this.setState({
          chartDataLength: data.Data.length,
          chartData: Object.assign({}, this.state.chartData, { [symbol]: data.Data }),
        })
      });
  }

  newChange(message) {
    const data = message.split("~");
    if (data[4] === "1" || data[4] === "2" || data[4] === "4") {
      var fsym = data[2]
      var detail;
      if (typeof this.state.data[fsym] === 'undefined') {
        detail = {
          price: data[5],
          volume24: data[10],
          open24: data[12],
        }
        detail.pctChange = ((detail.price - detail.open24) / detail.open24 * 100).toFixed(2)
      } else if (data[4] === "1" || data[4] === "2") {
        detail = Object.assign({}, this.state.data[fsym], {
          price: data[5],
          volume24: data[10]
        })
        detail.pctChange = ((detail.price - detail.open24) / detail.open24 * 100).toFixed(2)
      }
      this.setState({
        data: Object.assign({}, this.state.data, {
          [fsym]: Object.assign({}, this.state.data[fsym], detail),
        })
      })
    }
  }

  handleOnClick(symbol) {
    var newList = this.state.listVisible;
    newList[symbol] = !newList[symbol];
    this.setState({ listVisible: newList });
  }

  showCoinsMobile() {
    this.setState(prevState => ({
      cointsMobileShow: !prevState.cointsMobileShow
  }));
  }

  render() {
    return (
      <div className="app">
        <div className="container-fluid">
          <div className="row">
            <div className="col">
              <div className="app__title">Cryptocurrency watcher</div>
              <div className="app__description">
                <span className="app__text">Current Exchange: {exchange}</span>
                <span className="app__text">
                  <span>Data chart: </span>
                  <span style={{ color: this.state.chartDataLength ? '#63b556' : '#ff6939' }}>{this.state.chartDataLength ? ' On' : ' Off'}</span>
                </span>
                <span className="app__text">
                  <span>Data stream:</span>
                  <span style={{ color: this.state.socket === 'On' > 0 ? '#ff6939' : '#63b556' }}>{this.state.socket}</span>
                </span>
                <span className="app__text">Data source: <a href="https://www.cryptocompare.com">CryptoCompare</a></span>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="buttons">
                <div className={`buttons__mobile ${this.state.cointsMobileShow ? 'buttons__mobile--open' : ''}`} onClick={this.showCoinsMobile}>
                  <span>Coins</span>
                  <div className="icon-arrow"></div>
                </div>
                <div className={`buttons__content ${this.state.cointsMobileShow ? 'buttons__content--open' : 'buttons__content--hidden'}`}>
                  {this.state.watcher.map((symbol, i) =>
                  <button className={`button ${this.state.listVisible[symbol] ? 'button--hidden' : 'button--show'}`} key={symbol} onClick={() => this.handleOnClick(symbol)}>
                    {symbol}
                  </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row align-items-start justify-content-center">
            {this.state.watcher.map((symbol, i) =>
              <Watcher
                hidden={this.state.listVisible[symbol]}
                key={symbol}
                symbol={symbol}
                price={this.state.data[symbol] ? this.state.data[symbol].price : '...'}
                change={this.state.data[symbol] ? this.state.data[symbol].pctChange : '..'}
                popupDelay={.55 + i * .2}
                chartData={this.state.chartData[symbol]}
              />)}
          </div>
        </div>
      </div>
    )
  }
}

export default App;