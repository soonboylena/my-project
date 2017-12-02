<template>
    <div id="app" style="padding-bottom: 20px">
        <b-jumbotron header="jxx" :lead="'今天是 '+today">
            lszgjl：{{top}}
            <b-btn variant="link" href="#" size="sm">查看历史</b-btn>
        </b-jumbotron>

        <b-container fluid>
            <!--<div class="today">-->
            <b-progress class="mt-1" :max="max" height="30px">
                <b-progress-bar :value="storage1" variant="warning">
                </b-progress-bar>
                <b-progress-bar v-if="storage2 > 0" :value="storage2" variant="success">
                    <span v-if="storage2 >= 30">
                        <icon name="thumbs-o-up"></icon>
                        <icon name="thumbs-o-up"></icon>
                        <icon name="thumbs-o-up"></icon>
                    </span>
                    <span v-else-if="storage2 >= 20">
                        <icon name="thumbs-o-up"></icon>
                        <icon name="thumbs-o-up"></icon>
                    </span>
                    <span v-else-if="storage2 >= 10">
                        <icon name="thumbs-o-up"></icon>
                    </span>
                </b-progress-bar>
            </b-progress>
            <!--</div>-->
            <div class="list">
                <div>
                    <b-list-group>
                        <transition-group>
                            <b-list-group-item v-for="(value,key) in hints" :key="key">
                                <span v-if="value['didIt'] === true"> <icon name="smile-o" scale="2"></icon> </span>
                                <span v-else> <icon name="frown-o" scale="2" style="color: red"></icon> </span>
                                &nbsp;{{items[key].text}}
                                <span style="float:right">
                                    <b-button size="sm" variant="outline-success" v-on:click="selectedRemove(value,key)"><icon name="minus-circle"/></b-button>
                                </span>
                            </b-list-group-item>
                        </transition-group>
                    </b-list-group>
                </div>
            </div>
            <div>
                <span class="item" v-if="hints[key] === undefined" v-for="(value, key) in items" v-on:click="openSelectModal(value,key)">{{value.text}}</span>
                <b-button size="sm" variant="primary" v-on:click="addItem">
                    <icon name="plus"></icon>
                </b-button>
                <b-modal v-model="selectModalData.open" @ok="selectItem" :title="selectModalData.cur ? selectModalData.cur.text : ''">
                    <b-form-radio-group v-model="selectModalData.done" :options="selectModalData.options">
                    </b-form-radio-group>
                </b-modal>
                <b-modal v-model="modalInput.modalShow" @ok="addItemOk" title="请输入评价项">
                    <b-form-input v-model="modalInput.text"
                                  type="text"
                                  placeholder="请输入"></b-form-input>
                </b-modal>
            </div>
            <hr/>
            <div class="col-sm-12">
                <b-button size="lg" variant="primary" block disabled v-if="Object.keys(this.hints).length < 3">
                    (数量太少，无法评分）
                </b-button>
                <b-button size="lg" variant="primary" block v-on:click="pingfen" v-else>
                    评分
                </b-button>
            </div>
        </b-container>
    </div>
</template>

<script>

  export default {
    name: 'app',
    data() {
      return {
        today: new Date().toLocaleDateString(),
        top: 100,
        max: 100,
        defen: 0,
        modalInput: {
          modalShow: false,
          text: ''
        },
        selectModalData: {
          open: false,
          cur: '',
          done: true,
          options: [
            {text: '我做到了！！ ', value: true},
            {text: '我没做到', value: false}
          ]
        },
        tempInput: '',
        hints: {},
        items: {}
      }
    },
    computed: {
      storage1: function () {
        return Math.min(this.defen, this.max * 0.60);
      },
      storage2: function () {
        if (this.defen < this.max * 0.60) {
          return 0;
        }
        return Math.min(this.defen - this.max * 0.60, this.max * 0.40)
      },
    },
    mounted: function () {
      this.loadItems();
      this.loadHints(this.today);
    },
    methods: {
      addItem: function () {
        this.modalInput.modalShow = true
      },
      addItemOk: function () {
        let text = this.modalInput.text;

        if (text && text !== '') {
          this.$http.post('/api/rule', {'text': text}).then(response => {
            let rule = response.data;
            this.items[rule['id']] = rule;
            this.modalInput.text = '';
            this.modalInput.modalShow = false;
            this.defen = 0;
          }, response => {
          });
        }
      },
      selectItem: function () {
        this.hints[this.selectModalData.cur.id] = {
          'didIt': this.selectModalData.done
          , 'checkDate': this.today
          , rule: this.selectModalData.cur
          , rtScore: this.selectModalData.cur.score
        };
        this.selectModalData.cur = undefined;
        this.selectModalData.done = true;
      },
      openSelectModal: function (value, key) {
        if (this.hints[key] === undefined) {
          this.selectModalData.cur = value;
          this.selectModalData.open = true
        }
      },
      loadItems: function () {
        this.$http.get('/api/rules').then(response => {
          let itemsArray = response.data;
          if (itemsArray) {
            let tempItems = {};
            for (let item of itemsArray) {
              tempItems[item['id']] = item;
            }
            this.items = tempItems;
          }
        }, response => {
        });
      },
      loadHints: function (today) {
        this.$http.get('/api/hints', {params: {'date': today}}).then(response => {
          let data = response.data;
          this.hints = this.resetHints(data);
        }, response => {
        });
      },
      selectedRemove: function (value, key) {
        this.$delete(this.hints, key);
        this.defen = 0;
      },
      pingfen: function () {
        let keys = Object.keys(this.hints);

        let self = this;
        let fengmu = 0;
        let fengzi = 0;


        let results = [];
        for (let key of keys) {
          let score = self.items[key].score;
          fengmu += score;
          fengzi += self.hints[key]['didIt'] === true ? score : 0;

          results.push(self.hints[key]);
        }
        if (fengmu !== 0) {
          this.defen = Math.round(fengzi / fengmu * 100);
        }
        this.$http.post('/api/results', results).then(response => {
          let saved = response.data;
          this.hints = this.resetHints(saved);
        });
      },
      resetHints: function (saved) {
        let newHints = {};
        if (Array.isArray(saved)) {
          for (let hint of saved) {
            newHints[hint.rule.id] = hint;
          }
        }
        return newHints;
      }
    }
  }
</script>

<style scoped>
    .list {
        padding: 10px;
    }

    .item {
        display: inline-block;
        padding: 3px;
        margin: 5px 10px;
        border: solid 1px;
        border-radius: 5px;
    }

    .item:hover {
        background-color: #21fff7;
    }
</style>
